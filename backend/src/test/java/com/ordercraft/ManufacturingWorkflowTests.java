package com.ordercraft;

import com.ordercraft.dto.*;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.repository.*;
import com.ordercraft.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ManufacturingWorkflowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerService customerService;

    @Autowired
    private ProductService productService;

    @Autowired
    private MaterialService materialService;

    @Autowired
    private SupplierService supplierService;

    @Autowired
    private BOMService bomService;

    @Autowired
    private SalesOrderService salesOrderService;

    @Autowired
    private PurchaseOrderService purchaseOrderService;

    @Autowired
    private ProductionOrderService productionOrderService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private ProductionOrderRepository productionOrderRepository;

    private Customer customer;
    private Product product;
    private Material steel;
    private Material wood;
    private Material paint;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        // Setup realistic data matching the primary demo requirement
        customer = customerService.createCustomer(new Customer(
                null, "Apex Interiors", "apex@example.com", "9876543210",
                "Apex Interiors Pvt Ltd", "Mumbai", "27AABCA1234F1Z5", null
        ));

        supplier = supplierService.createSupplier(new Supplier(
                null, "Precision Steel Co", "steel@example.com", "9876500000",
                "Precision Steel Ltd", "Navi Mumbai", null
        ));

        // Inventory as required: Steel = 1500kg, Wood = 1200kg, Paint = 300L
        steel = materialService.createMaterial(new Material(
                null, "TEST-MAT-STL", "Steel Sheet", "kg",
                BigDecimal.valueOf(1500.00), BigDecimal.ZERO, BigDecimal.valueOf(500.00), null
        ));

        wood = materialService.createMaterial(new Material(
                null, "TEST-MAT-WOD", "Timber Wood", "kg",
                BigDecimal.valueOf(1200.00), BigDecimal.ZERO, BigDecimal.valueOf(300.00), null
        ));

        paint = materialService.createMaterial(new Material(
                null, "TEST-MAT-PNT", "Enamel Paint", "litre",
                BigDecimal.valueOf(300.00), BigDecimal.ZERO, BigDecimal.valueOf(100.00), null
        ));

        product = productService.createProduct(new Product(
                null, "TEST-PRD-TBL", "Office Table Demo",
                "Standard 100 table demo product", "Furniture",
                BigDecimal.valueOf(1000.00), null
        ));

        // BOM: Steel 20kg, Wood 10kg, Paint 2 litre
        BOMRequest bomReq = new BOMRequest(
                product.getId(), "v1.0", true,
                List.of(
                        new BOMItemRequest(steel.getId(), BigDecimal.valueOf(20.0)),
                        new BOMItemRequest(wood.getId(), BigDecimal.valueOf(10.0)),
                        new BOMItemRequest(paint.getId(), BigDecimal.valueOf(2.0))
                )
        );
        bomService.createBOM(bomReq);
    }

    @Test
    @DisplayName("Complete End-to-End Workflow: Order 100 tables -> Shortage 500kg steel -> PO -> Receipt -> Production -> Invoice -> Partial & Full Payment")
    void testCompleteManufacturingWorkflow() {
        // 1. Create Sales Order for 100 Office Tables
        SalesOrderRequest soRequest = new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Priority order for 100 Office Tables",
                List.of(new SalesOrderItemRequest(product.getId(), 100, BigDecimal.valueOf(1000.00)))
        );
        SalesOrder order = salesOrderService.createOrder(soRequest);
        assertNotNull(order.getId());
        assertEquals(OrderStatus.DRAFT, order.getStatus());
        assertEquals(0, new BigDecimal("100000.00").compareTo(order.getTotalAmount()));

        // 2. Confirm order -> triggers material check automatically
        SalesOrder confirmedOrder = salesOrderService.confirmOrder(order.getId());

        // Steel requirement = 100 * 20 = 2000 kg. Available = 1500 kg. Shortage = 500 kg!
        // Wood requirement = 100 * 10 = 1000 kg. Available = 1200 kg. Shortage = 0.
        // Paint requirement = 100 * 2 = 200 L. Available = 300 L. Shortage = 0.
        assertEquals(OrderStatus.SHORTAGE, confirmedOrder.getStatus());

        MaterialCheckResponse checkResponse = salesOrderService.getMaterialRequirementsPreview(order.getId());
        assertTrue(checkResponse.isHasAnyShortage());

        MaterialRequirementItemDto steelReq = checkResponse.getRequirements().stream()
                .filter(r -> r.getMaterialId().equals(steel.getId()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("2000.00").compareTo(steelReq.getRequiredQuantity()));
        assertEquals(0, new BigDecimal("500.00").compareTo(steelReq.getShortageQuantity()));
        assertTrue(steelReq.isHasShortage());

        // 3. Prevent production start when material shortage exists
        assertThrows(BusinessException.class, () -> {
            productionOrderService.createAndStartForSalesOrder(order.getId());
        });

        // 4. Create Purchase Order for 500 kg steel shortage
        PurchaseOrderRequest poRequest = new PurchaseOrderRequest(
                supplier.getId(),
                order.getId(),
                LocalDate.now(),
                "PO to cover 500kg steel shortage for order " + order.getOrderNumber(),
                List.of(new PurchaseOrderItemRequest(steel.getId(), BigDecimal.valueOf(500.00), BigDecimal.valueOf(60.00)))
        );
        PurchaseOrder po = purchaseOrderService.createPurchaseOrder(poRequest);
        assertEquals(PurchaseOrderStatus.DRAFT, po.getStatus());

        po = purchaseOrderService.markOrdered(po.getId());
        assertEquals(PurchaseOrderStatus.ORDERED, po.getStatus());

        // 5. Receive Purchase Order -> Stock increases by 500kg, linked Sales Order is re-checked and becomes READY_FOR_PRODUCTION!
        po = purchaseOrderService.receivePurchaseOrder(po.getId());
        assertEquals(PurchaseOrderStatus.RECEIVED, po.getStatus());

        // Check updated steel stock: 1500 + 500 = 2000 kg
        Material updatedSteel = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("2000.00").compareTo(updatedSteel.getCurrentStock()));

        // The sales order should now have automatically transitioned to READY_FOR_PRODUCTION with reserved stock!
        SalesOrder readyOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.READY_FOR_PRODUCTION, readyOrder.getStatus());
        assertEquals(0, new BigDecimal("2000.00").compareTo(updatedSteel.getReservedStock()));

        // 6. Start Production -> consumes reserved stock
        ProductionOrder plannedProd = productionOrderService.planProductionOrder(
                new ProductionOrderRequest(order.getId(), 100, "Starting batch production")
        );
        assertEquals(ProductionOrderStatus.PLANNED, plannedProd.getStatus());

        ProductionOrder activeProd = productionOrderService.startProduction(plannedProd.getId());
        assertEquals(ProductionOrderStatus.IN_PROGRESS, activeProd.getStatus());

        SalesOrder inProdOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.IN_PRODUCTION, inProdOrder.getStatus());

        // Check stock consumed: Current stock was 2000 - 2000 = 0, Reserved stock = 0
        Material consumedSteel = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(consumedSteel.getCurrentStock()));
        assertEquals(0, BigDecimal.ZERO.compareTo(consumedSteel.getReservedStock()));

        // 7. Complete Production
        ProductionOrder completedProd = productionOrderService.completeProduction(activeProd.getId());
        assertEquals(ProductionOrderStatus.COMPLETED, completedProd.getStatus());
        assertEquals(100, completedProd.getCompletedQuantity());

        SalesOrder completedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.COMPLETED, completedOrder.getStatus());

        // 8. Generate Invoice: Subtotal = 100,000, 18% Tax = 18,000, Total = 118,000
        Invoice invoice = invoiceService.generateInvoice(new InvoiceCreateRequest(order.getId(), LocalDate.now().plusDays(15), "Net 15 days"));
        assertEquals(InvoiceStatus.ISSUED, invoice.getStatus());
        assertEquals(0, new BigDecimal("100000.00").compareTo(invoice.getSubtotal()));
        assertEquals(0, new BigDecimal("18000.00").compareTo(invoice.getTaxAmount()));
        assertEquals(0, new BigDecimal("118000.00").compareTo(invoice.getTotalAmount()));
        assertEquals(0, new BigDecimal("118000.00").compareTo(invoice.getRemainingAmount()));

        SalesOrder invoicedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.INVOICED, invoicedOrder.getStatus());

        // 9. Record Partial Payment: ₹50,000
        Payment partPayment = paymentService.recordPayment(new PaymentRequest(
                invoice.getId(),
                BigDecimal.valueOf(50000.00),
                LocalDate.now(),
                PaymentMethod.BANK_TRANSFER,
                "TXN-NEFT-991823",
                "First installment received"
        ));
        assertNotNull(partPayment.getId());

        Invoice partialInvoice = invoiceService.getInvoiceById(invoice.getId());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, partialInvoice.getStatus());
        assertEquals(0, new BigDecimal("50000.00").compareTo(partialInvoice.getPaidAmount()));
        assertEquals(0, new BigDecimal("68000.00").compareTo(partialInvoice.getRemainingAmount()));

        SalesOrder partialOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.PARTIALLY_PAID, partialOrder.getStatus());

        // Prevent payment greater than remaining balance
        assertThrows(BusinessException.class, () -> {
            paymentService.recordPayment(new PaymentRequest(
                    invoice.getId(),
                    BigDecimal.valueOf(70000.00), // Exceeds 68,000
                    LocalDate.now(),
                    PaymentMethod.UPI,
                    "TXN-FAIL",
                    "Overpayment attempt"
            ));
        });

        // 10. Record Remaining Payment: ₹68,000 -> PAID
        Payment fullPayment = paymentService.recordPayment(new PaymentRequest(
                invoice.getId(),
                BigDecimal.valueOf(68000.00),
                LocalDate.now(),
                PaymentMethod.UPI,
                "TXN-UPI-008123",
                "Final settlement received"
        ));
        assertNotNull(fullPayment.getId());

        Invoice paidInvoice = invoiceService.getInvoiceById(invoice.getId());
        assertEquals(InvoiceStatus.PAID, paidInvoice.getStatus());
        assertEquals(0, new BigDecimal("118000.00").compareTo(paidInvoice.getPaidAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(paidInvoice.getRemainingAmount()));

        SalesOrder fullyPaidOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.PAID, fullyPaidOrder.getStatus());
    }

    @Test
    @DisplayName("Phase 1: Multiple products sharing raw material consume cumulative stock without overwriting")
    void testMultipleProductsSharingMaterial_CumulativeStockReservationAndDeduction() {
        Product chair = productService.createProduct(new Product(
                null, "TEST-PRD-CHR", "Steel Chair Demo",
                "Ergonomic chair", "Furniture",
                BigDecimal.valueOf(250.00), null
        ));

        bomService.createBOM(new BOMRequest(
                chair.getId(), "v1.0", true,
                List.of(
                        new BOMItemRequest(steel.getId(), BigDecimal.valueOf(5.0)),
                        new BOMItemRequest(wood.getId(), BigDecimal.valueOf(2.0))
                )
        ));

        // Create Sales Order with 10 Tables and 20 Chairs
        // Table: 10 * 20kg Steel = 200kg, 10 * 10kg Wood = 100kg
        // Chair: 20 * 5kg Steel = 100kg, 20 * 2kg Wood = 40kg
        // Cumulative requirements: Steel = 300kg, Wood = 140kg
        SalesOrderRequest soRequest = new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Multi-product order sharing materials",
                List.of(
                        new SalesOrderItemRequest(product.getId(), 10, BigDecimal.valueOf(1000.00)),
                        new SalesOrderItemRequest(chair.getId(), 20, BigDecimal.valueOf(250.00))
                )
        );

        SalesOrder order = salesOrderService.createOrder(soRequest);
        SalesOrder confirmedOrder = salesOrderService.confirmOrder(order.getId());
        assertEquals(OrderStatus.READY_FOR_PRODUCTION, confirmedOrder.getStatus());

        // Verify cumulative reservations
        Material steelAfterReserve = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("300.00").compareTo(steelAfterReserve.getReservedStock()));
        assertEquals(0, new BigDecimal("1500.00").compareTo(steelAfterReserve.getCurrentStock()));

        Material woodAfterReserve = materialRepository.findById(wood.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("140.00").compareTo(woodAfterReserve.getReservedStock()));
        assertEquals(0, new BigDecimal("1200.00").compareTo(woodAfterReserve.getCurrentStock()));

        // Plan and start production
        ProductionOrder plannedProd = productionOrderService.planProductionOrder(
                new ProductionOrderRequest(order.getId(), 30, "Multi-product production")
        );
        ProductionOrder activeProd = productionOrderService.startProduction(plannedProd.getId());
        assertEquals(ProductionOrderStatus.IN_PROGRESS, activeProd.getStatus());

        // Verify cumulative deduction:
        // Steel: 1500 - 300 = 1200 current, 0 reserved
        // Wood: 1200 - 140 = 1060 current, 0 reserved
        Material steelAfterProd = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("1200.00").compareTo(steelAfterProd.getCurrentStock()));
        assertEquals(0, BigDecimal.ZERO.compareTo(steelAfterProd.getReservedStock()));

        Material woodAfterProd = materialRepository.findById(wood.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("1060.00").compareTo(woodAfterProd.getCurrentStock()));
        assertEquals(0, BigDecimal.ZERO.compareTo(woodAfterProd.getReservedStock()));
    }

    @Test
    @DisplayName("Phase 1: Release cumulative reserved materials cleanly when multi-item order is cancelled")
    void testMultipleProductsSharingMaterial_ReleaseReservedOnOrderCancellation() {
        Product chair = productService.createProduct(new Product(
                null, "TEST-PRD-CHR2", "Steel Chair Demo 2",
                "Chair demo", "Furniture",
                BigDecimal.valueOf(250.00), null
        ));

        bomService.createBOM(new BOMRequest(
                chair.getId(), "v1.0", true,
                List.of(
                        new BOMItemRequest(steel.getId(), BigDecimal.valueOf(5.0)),
                        new BOMItemRequest(wood.getId(), BigDecimal.valueOf(2.0))
                )
        ));

        SalesOrderRequest soRequest = new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Cancel multi-product order",
                List.of(
                        new SalesOrderItemRequest(product.getId(), 10, BigDecimal.valueOf(1000.00)),
                        new SalesOrderItemRequest(chair.getId(), 20, BigDecimal.valueOf(250.00))
                )
        );

        SalesOrder order = salesOrderService.createOrder(soRequest);
        salesOrderService.confirmOrder(order.getId());

        Material steelReserved = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("300.00").compareTo(steelReserved.getReservedStock()));

        // Cancel order while READY_FOR_PRODUCTION
        SalesOrder cancelledOrder = salesOrderService.cancelOrder(order.getId());
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());

        // Verify reserved stock released completely back to 0
        Material steelAfterCancel = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(steelAfterCancel.getReservedStock()));
        assertEquals(0, new BigDecimal("1500.00").compareTo(steelAfterCancel.getCurrentStock()));

        Material woodAfterCancel = materialRepository.findById(wood.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(woodAfterCancel.getReservedStock()));
        assertEquals(0, new BigDecimal("1200.00").compareTo(woodAfterCancel.getCurrentStock()));
    }

    @Test
    @DisplayName("Phase 1: Multi-product order detects cumulative shortage when individual items fit but combined exceeds stock")
    void testMultipleProductsSharingMaterial_InsufficientCumulativeStockFailsCleanly() {
        Material titanium = materialService.createMaterial(new Material(
                null, "TEST-MAT-TI", "Titanium Rod", "kg",
                BigDecimal.valueOf(50.00), BigDecimal.ZERO, BigDecimal.valueOf(10.00), null
        ));

        Product itemA = productService.createProduct(new Product(
                null, "TEST-PRD-A", "Component A", "Part A", "Hardware",
                BigDecimal.valueOf(500.00), null
        ));
        bomService.createBOM(new BOMRequest(
                itemA.getId(), "v1.0", true,
                List.of(new BOMItemRequest(titanium.getId(), BigDecimal.valueOf(30.0)))
        ));

        Product itemB = productService.createProduct(new Product(
                null, "TEST-PRD-B", "Component B", "Part B", "Hardware",
                BigDecimal.valueOf(500.00), null
        ));
        bomService.createBOM(new BOMRequest(
                itemB.getId(), "v1.0", true,
                List.of(new BOMItemRequest(titanium.getId(), BigDecimal.valueOf(30.0)))
        ));

        // 1 unit of A needs 30kg. 1 unit of B needs 30kg. Combined = 60kg. Available = 50kg.
        SalesOrderRequest soRequest = new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Cumulative shortage order",
                List.of(
                        new SalesOrderItemRequest(itemA.getId(), 1, BigDecimal.valueOf(500.00)),
                        new SalesOrderItemRequest(itemB.getId(), 1, BigDecimal.valueOf(500.00))
                )
        );

        SalesOrder order = salesOrderService.createOrder(soRequest);
        SalesOrder confirmedOrder = salesOrderService.confirmOrder(order.getId());

        assertEquals(OrderStatus.SHORTAGE, confirmedOrder.getStatus());

        MaterialCheckResponse preview = salesOrderService.getMaterialRequirementsPreview(order.getId());
        assertTrue(preview.isHasAnyShortage());

        MaterialRequirementItemDto tiReq = preview.getRequirements().stream()
                .filter(r -> r.getMaterialId().equals(titanium.getId()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("60.00").compareTo(tiReq.getRequiredQuantity()));
        assertEquals(0, new BigDecimal("10.00").compareTo(tiReq.getShortageQuantity()));
        assertTrue(tiReq.isHasShortage());

        assertThrows(BusinessException.class, () -> {
            productionOrderService.createAndStartForSalesOrder(order.getId());
        });
    }

    @Test
    @DisplayName("Phase 1: Cancelling an unpaid invoice reverts Sales Order to COMPLETED and allows re-invoicing")
    void testInvoiceCancellation_RevertsSalesOrderToCompletedAndAllowsReInvoicing() {
        // 1. Create order for 10 tables (sufficient stock, no shortage)
        SalesOrder order = salesOrderService.createOrder(new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Order to test invoice cancellation",
                List.of(new SalesOrderItemRequest(product.getId(), 10, BigDecimal.valueOf(1000.00)))
        ));
        salesOrderService.confirmOrder(order.getId());

        // 2. Start & Complete Production
        ProductionOrder prodOrder = productionOrderService.createAndStartForSalesOrder(order.getId());
        productionOrderService.completeProduction(prodOrder.getId());

        SalesOrder completedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.COMPLETED, completedOrder.getStatus());

        // 3. Generate first invoice (INV-1)
        Invoice inv1 = invoiceService.generateInvoice(new InvoiceCreateRequest(
                order.getId(), LocalDate.now().plusDays(15), "Initial invoice with typo"
        ));
        assertEquals(InvoiceStatus.ISSUED, inv1.getStatus());

        SalesOrder invoicedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.INVOICED, invoicedOrder.getStatus());

        // 4. Cancel INV-1
        Invoice cancelledInv = invoiceService.cancelInvoice(inv1.getId());
        assertEquals(InvoiceStatus.CANCELLED, cancelledInv.getStatus());

        // 5. Verify Sales Order safely reverted back to COMPLETED
        SalesOrder revertedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.COMPLETED, revertedOrder.getStatus());

        // 6. Generate second corrected invoice (INV-2) -> must succeed!
        Invoice inv2 = invoiceService.generateInvoice(new InvoiceCreateRequest(
                order.getId(), LocalDate.now().plusDays(30), "Corrected terms invoice"
        ));
        assertNotNull(inv2.getId());
        assertEquals(InvoiceStatus.ISSUED, inv2.getStatus());
        assertNotEquals(inv1.getInvoiceNumber(), inv2.getInvoiceNumber());

        SalesOrder reinvoicedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.INVOICED, reinvoicedOrder.getStatus());
    }

    @Test
    @DisplayName("Phase 1: Cancelling an already cancelled invoice throws BusinessException")
    void testInvoiceCancellation_RejectsCancellation_WhenAlreadyCancelled() {
        SalesOrder order = salesOrderService.createOrder(new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Order for double-cancel test",
                List.of(new SalesOrderItemRequest(product.getId(), 5, BigDecimal.valueOf(1000.00)))
        ));
        salesOrderService.confirmOrder(order.getId());
        ProductionOrder prod = productionOrderService.createAndStartForSalesOrder(order.getId());
        productionOrderService.completeProduction(prod.getId());

        Invoice inv = invoiceService.generateInvoice(new InvoiceCreateRequest(
                order.getId(), LocalDate.now().plusDays(15), "Invoice to cancel twice"
        ));
        invoiceService.cancelInvoice(inv.getId());

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            invoiceService.cancelInvoice(inv.getId());
        });
        assertTrue(ex.getMessage().contains("already cancelled"));
    }

    @Test
    @DisplayName("Phase 1: Cancelling an invoice with recorded payments is strictly rejected")
    void testInvoiceCancellation_RejectsCancellation_WhenPartiallyPaidOrFullyPaid() {
        SalesOrder order = salesOrderService.createOrder(new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Order for payment protection test",
                List.of(new SalesOrderItemRequest(product.getId(), 10, BigDecimal.valueOf(1000.00)))
        ));
        salesOrderService.confirmOrder(order.getId());
        ProductionOrder prod = productionOrderService.createAndStartForSalesOrder(order.getId());
        productionOrderService.completeProduction(prod.getId());

        Invoice inv = invoiceService.generateInvoice(new InvoiceCreateRequest(
                order.getId(), LocalDate.now().plusDays(15), "Invoice with payments"
        ));
        // Total = 10,000 + 18% = 11,800. Record partial payment of 5,000
        paymentService.recordPayment(new PaymentRequest(
                inv.getId(),
                BigDecimal.valueOf(5000.00),
                LocalDate.now(),
                PaymentMethod.BANK_TRANSFER,
                "REF-PART-123",
                "Partial advance"
        ));

        Invoice partInv = invoiceService.getInvoiceById(inv.getId());
        assertEquals(InvoiceStatus.PARTIALLY_PAID, partInv.getStatus());

        // Attempt to cancel partially paid invoice -> must be rejected!
        BusinessException exPart = assertThrows(BusinessException.class, () -> {
            invoiceService.cancelInvoice(inv.getId());
        });
        assertTrue(exPart.getMessage().contains("payments have already been recorded"));

        // Record remaining payment 6,800 -> becomes PAID
        paymentService.recordPayment(new PaymentRequest(
                inv.getId(),
                BigDecimal.valueOf(6800.00),
                LocalDate.now(),
                PaymentMethod.UPI,
                "REF-FULL-123",
                "Full balance"
        ));

        Invoice fullInv = invoiceService.getInvoiceById(inv.getId());
        assertEquals(InvoiceStatus.PAID, fullInv.getStatus());

        // Attempt to cancel paid invoice -> must be rejected!
        BusinessException exPaid = assertThrows(BusinessException.class, () -> {
            invoiceService.cancelInvoice(inv.getId());
        });
        assertTrue(exPaid.getMessage().contains("already paid"));

        // Verify status remains PAID and balance untouched
        Invoice verifiedInv = invoiceService.getInvoiceById(inv.getId());
        assertEquals(InvoiceStatus.PAID, verifiedInv.getStatus());
        assertEquals(0, new BigDecimal("11800.00").compareTo(verifiedInv.getPaidAmount()));
    }

    @Test
    @DisplayName("Phase 2: Cancelling a Sales Order while production is actively in progress is strictly rejected")
    void testSalesOrderCancellation_PreventedWhileProductionInProgress() {
        // 1. Create order for 10 tables and confirm
        SalesOrder order = salesOrderService.createOrder(new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Order for production cancellation protection test",
                List.of(new SalesOrderItemRequest(product.getId(), 10, BigDecimal.valueOf(1000.00)))
        ));
        salesOrderService.confirmOrder(order.getId());

        // 2. Start production -> Order transitions to IN_PRODUCTION, ProductionOrder to IN_PROGRESS
        ProductionOrder prodOrder = productionOrderService.createAndStartForSalesOrder(order.getId());
        assertEquals(ProductionOrderStatus.IN_PROGRESS, prodOrder.getStatus());

        SalesOrder inProdOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.IN_PRODUCTION, inProdOrder.getStatus());

        // 3. Attempt to cancel sales order -> MUST BE REJECTED!
        BusinessException ex = assertThrows(BusinessException.class, () -> {
            salesOrderService.cancelOrder(order.getId());
        });
        assertTrue(ex.getMessage().contains("production is in progress") || ex.getMessage().contains("in progress"));

        // 4. Verify sales order remains IN_PRODUCTION and production order remains IN_PROGRESS
        SalesOrder stillInProd = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.IN_PRODUCTION, stillInProd.getStatus());

        ProductionOrder stillActiveProd = productionOrderRepository.findById(prodOrder.getId()).orElseThrow();
        assertEquals(ProductionOrderStatus.IN_PROGRESS, stillActiveProd.getStatus());
    }

    @Test
    @DisplayName("Phase 2: Cancelling a READY_FOR_PRODUCTION order releases reserved materials and cancels planned production order")
    void testSalesOrderCancellation_InReadyStatus_ReleasesMaterialsAndCancelsPlannedProduction() {
        // 1. Create order for 10 tables (requires 200kg steel, 100kg wood, 20L paint)
        SalesOrder order = salesOrderService.createOrder(new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Order for ready-cancel test",
                List.of(new SalesOrderItemRequest(product.getId(), 10, BigDecimal.valueOf(1000.00)))
        ));
        salesOrderService.confirmOrder(order.getId());

        // Verify materials were reserved
        Material steelBeforeCancel = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, new BigDecimal("200.00").compareTo(steelBeforeCancel.getReservedStock()));

        // Plan a production order (status = PLANNED)
        ProductionOrder plannedProd = productionOrderService.planProductionOrder(
                new ProductionOrderRequest(order.getId(), 10, "Planned run")
        );
        assertEquals(ProductionOrderStatus.PLANNED, plannedProd.getStatus());

        // 2. Cancel order while READY_FOR_PRODUCTION
        SalesOrder cancelledOrder = salesOrderService.cancelOrder(order.getId());
        assertEquals(OrderStatus.CANCELLED, cancelledOrder.getStatus());

        // 3. Verify reserved stock is cleanly released back to 0
        Material steelAfterCancel = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(steelAfterCancel.getReservedStock()));
        assertEquals(0, new BigDecimal("1500.00").compareTo(steelAfterCancel.getCurrentStock()));

        // 4. Verify the planned production order was also cancelled
        ProductionOrder updatedProd = productionOrderRepository.findById(plannedProd.getId()).orElseThrow();
        assertEquals(ProductionOrderStatus.CANCELLED, updatedProd.getStatus());

        // 5. Attempting to start the cancelled planned job must fail
        assertThrows(BusinessException.class, () -> {
            productionOrderService.startProduction(plannedProd.getId());
        });
    }

    @Test
    @DisplayName("Phase 2: Cancelling an already cancelled sales order throws BusinessException")
    void testSalesOrderCancellation_RejectsDoubleCancel() {
        SalesOrder order = salesOrderService.createOrder(new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Double cancel order test",
                List.of(new SalesOrderItemRequest(product.getId(), 2, BigDecimal.valueOf(1000.00)))
        ));
        salesOrderService.cancelOrder(order.getId());

        BusinessException ex = assertThrows(BusinessException.class, () -> {
            salesOrderService.cancelOrder(order.getId());
        });
        assertTrue(ex.getMessage().contains("already cancelled"));
    }

    @Test
    @DisplayName("Phase 2: Production completion cannot overwrite a cancelled sales order")
    void testProductionCompletion_RejectsWhenSalesOrderCancelled() {
        SalesOrder order = salesOrderService.createOrder(new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Cancelled sales order cannot be completed test",
                List.of(new SalesOrderItemRequest(product.getId(), 5, BigDecimal.valueOf(1000.00)))
        ));
        salesOrderService.confirmOrder(order.getId());

        ProductionOrder planned = productionOrderService.planProductionOrder(
                new ProductionOrderRequest(order.getId(), 5, "Test plan")
        );
        ProductionOrder inProgress = productionOrderService.startProduction(planned.getId());

        // Manually simulate a cancelled sales order reference
        order.setStatus(OrderStatus.CANCELLED);
        salesOrderRepository.save(order);

        // Attempting to complete production must throw BusinessException and refuse to set order to COMPLETED
        BusinessException ex = assertThrows(BusinessException.class, () -> {
            productionOrderService.completeProduction(inProgress.getId());
        });
        assertTrue(ex.getMessage().contains("cancelled"));

        SalesOrder verifiedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, verifiedOrder.getStatus());
    }

    @Test
    @DisplayName("Phase 3: Authorized read requests on Invoice endpoints for ACCOUNTS role")
    @WithMockUser(username = "accounts_user", roles = {"ACCOUNTS"})
    void testInvoiceRead_AuthorizedForAccounts() throws Exception {
        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Phase 3: Sales user is forbidden from reading financial invoices")
    @WithMockUser(username = "sales_user", roles = {"SALES"})
    void testInvoiceRead_ForbiddenForSales() throws Exception {
        mockMvc.perform(get("/api/invoices"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Phase 3: Purchase user is authorized to read Purchase Orders, but forbidden from Production Orders")
    @WithMockUser(username = "purchase_user", roles = {"PURCHASE"})
    void testPurchaseAndProductionRead_RoleEnforcement() throws Exception {
        // Purchase user reading purchase orders -> 200 OK
        mockMvc.perform(get("/api/purchase-orders"))
                .andExpect(status().isOk());

        // Purchase user trying to read production orders -> 403 Forbidden
        mockMvc.perform(get("/api/production-orders"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Phase 3: Production user can read BOM recipes")
    @WithMockUser(username = "prod_user", roles = {"PRODUCTION"})
    void testBOMRead_AuthorizedForProduction() throws Exception {
        mockMvc.perform(get("/api/boms"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Phase 3: Accounts user is forbidden from reading BOM recipes")
    @WithMockUser(username = "accounts_user", roles = {"ACCOUNTS"})
    void testBOMRead_ForbiddenForAccounts() throws Exception {
        mockMvc.perform(get("/api/boms"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Phase 3: Authenticated roles can read Dashboard KPIs")
    @WithMockUser(username = "sales_user", roles = {"SALES"})
    void testDashboardRead_AuthorizedForAuthenticated() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Phase 3: Unauthenticated user is unauthorized from reading Dashboard")
    void testDashboardRead_UnauthorizedForAnonymous() throws Exception {
        mockMvc.perform(get("/api/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Phase 4: Receiving PO with duplicate material lines aggregates cumulative stock correctly")
    void testReceivePurchaseOrder_DuplicateMaterialLines_AggregatesStockCorrectly() {
        BigDecimal initialSteelStock = steel.getCurrentStock();
        BigDecimal initialWoodStock = wood.getCurrentStock();

        PurchaseOrderRequest poRequest = new PurchaseOrderRequest(
                supplier.getId(),
                null,
                LocalDate.now(),
                "Multi-batch order containing duplicate material lines",
                List.of(
                        new PurchaseOrderItemRequest(steel.getId(), BigDecimal.valueOf(250.00), BigDecimal.valueOf(55.00)),
                        new PurchaseOrderItemRequest(wood.getId(), BigDecimal.valueOf(100.00), BigDecimal.valueOf(40.00)),
                        new PurchaseOrderItemRequest(steel.getId(), BigDecimal.valueOf(350.00), BigDecimal.valueOf(52.00))
                )
        );

        PurchaseOrder po = purchaseOrderService.createPurchaseOrder(poRequest);
        assertEquals(PurchaseOrderStatus.DRAFT, po.getStatus());
        assertEquals(3, po.getItems().size());

        // Total amount = (250*55) + (100*40) + (350*52) = 13750 + 4000 + 18200 = 35950.00
        assertEquals(0, new BigDecimal("35950.00").compareTo(po.getTotalAmount()));

        // Receive the purchase order
        PurchaseOrder receivedPo = purchaseOrderService.receivePurchaseOrder(po.getId());
        assertEquals(PurchaseOrderStatus.RECEIVED, receivedPo.getStatus());

        // Steel cumulative addition: 250 + 350 = 600. Total = initial + 600
        Material updatedSteel = materialRepository.findById(steel.getId()).orElseThrow();
        assertEquals(0, initialSteelStock.add(BigDecimal.valueOf(600.00)).compareTo(updatedSteel.getCurrentStock()));

        // Wood addition: 100. Total = initial + 100
        Material updatedWood = materialRepository.findById(wood.getId()).orElseThrow();
        assertEquals(0, initialWoodStock.add(BigDecimal.valueOf(100.00)).compareTo(updatedWood.getCurrentStock()));
    }

    @Test
    @DisplayName("Phase 4: Normal goods receipt transitions linked Sales Order from SHORTAGE to READY_FOR_PRODUCTION")
    void testReceivePurchaseOrder_NormalGoodsReceipt_TransitionsSalesOrderFromShortage() {
        SalesOrderRequest soRequest = new SalesOrderRequest(
                customer.getId(),
                LocalDate.now(),
                "Order causing steel shortage",
                List.of(new SalesOrderItemRequest(product.getId(), 100, BigDecimal.valueOf(1000.00)))
        );
        SalesOrder order = salesOrderService.createOrder(soRequest);
        SalesOrder confirmedOrder = salesOrderService.confirmOrder(order.getId());
        assertEquals(OrderStatus.SHORTAGE, confirmedOrder.getStatus());

        PurchaseOrderRequest poRequest = new PurchaseOrderRequest(
                supplier.getId(),
                order.getId(),
                LocalDate.now(),
                "Shortage replenishment PO",
                List.of(new PurchaseOrderItemRequest(steel.getId(), BigDecimal.valueOf(500.00), BigDecimal.valueOf(60.00)))
        );
        PurchaseOrder po = purchaseOrderService.createPurchaseOrder(poRequest);
        purchaseOrderService.markOrdered(po.getId());

        PurchaseOrder receivedPo = purchaseOrderService.receivePurchaseOrder(po.getId());
        assertEquals(PurchaseOrderStatus.RECEIVED, receivedPo.getStatus());

        SalesOrder updatedOrder = salesOrderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.READY_FOR_PRODUCTION, updatedOrder.getStatus());
    }

    @Test
    @DisplayName("Phase 4: Receiving already received or cancelled PO throws BusinessException")
    void testReceivePurchaseOrder_Guards_RejectsAlreadyReceivedOrCancelled() {
        PurchaseOrderRequest poRequest = new PurchaseOrderRequest(
                supplier.getId(),
                null,
                LocalDate.now(),
                "PO for guard validation",
                List.of(new PurchaseOrderItemRequest(paint.getId(), BigDecimal.valueOf(50.00), BigDecimal.valueOf(25.00)))
        );
        PurchaseOrder po = purchaseOrderService.createPurchaseOrder(poRequest);
        purchaseOrderService.receivePurchaseOrder(po.getId());

        BusinessException ex1 = assertThrows(BusinessException.class, () -> {
            purchaseOrderService.receivePurchaseOrder(po.getId());
        });
        assertTrue(ex1.getMessage().contains("already been received"));

        PurchaseOrderRequest poRequest2 = new PurchaseOrderRequest(
                supplier.getId(),
                null,
                LocalDate.now(),
                "PO to be cancelled",
                List.of(new PurchaseOrderItemRequest(paint.getId(), BigDecimal.valueOf(20.00), BigDecimal.valueOf(25.00)))
        );
        PurchaseOrder po2 = purchaseOrderService.createPurchaseOrder(poRequest2);
        purchaseOrderService.cancelPurchaseOrder(po2.getId());

        BusinessException ex2 = assertThrows(BusinessException.class, () -> {
            purchaseOrderService.receivePurchaseOrder(po2.getId());
        });
        assertTrue(ex2.getMessage().contains("Cannot receive a cancelled purchase order"));
    }
}
