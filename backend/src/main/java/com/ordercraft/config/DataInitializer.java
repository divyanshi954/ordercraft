package com.ordercraft.config;

import com.ordercraft.entity.*;
import com.ordercraft.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final MaterialRepository materialRepository;
    private final SupplierRepository supplierRepository;
    private final BOMRepository bomRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           CustomerRepository customerRepository,
                           ProductRepository productRepository,
                           MaterialRepository materialRepository,
                           SupplierRepository supplierRepository,
                           BOMRepository bomRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.materialRepository = materialRepository;
        this.supplierRepository = supplierRepository;
        this.bomRepository = bomRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedUsers();
        seedCustomers();
        seedMaterialsAndSuppliersAndProducts();
    }

    private void seedUsers() {
        if (userRepository.count() > 0) {
            return;
        }

        createUser("admin", "admin@ordercraft.com", "admin123", "System Administrator", Role.ADMIN);
        createUser("sales", "sales@ordercraft.com", "sales123", "Sales Executive", Role.SALES);
        createUser("purchase", "purchase@ordercraft.com", "purchase123", "Purchase Officer", Role.PURCHASE);
        createUser("production", "prod@ordercraft.com", "prod123", "Production Manager", Role.PRODUCTION);
        createUser("accounts", "accounts@ordercraft.com", "accounts123", "Accounts Officer", Role.ACCOUNTS);
    }

    private void createUser(String username, String email, String rawPassword, String fullName, Role role) {
        User user = new User(
                null,
                username,
                email,
                passwordEncoder.encode(rawPassword),
                fullName,
                role,
                true,
                LocalDateTime.now()
        );
        userRepository.save(user);
    }

    private void seedCustomers() {
        if (customerRepository.count() > 0) {
            return;
        }

        customerRepository.save(new Customer(
                null,
                "Apex Interiors Pvt Ltd",
                "procurement@apexinteriors.com",
                "+91 98201 12345",
                "Apex Interiors Pvt Ltd",
                "Unit 402, Trade World, Senapati Bapat Marg, Lower Parel, Mumbai 400013",
                "27AABCA1234F1Z5",
                LocalDateTime.now()
        ));

        customerRepository.save(new Customer(
                null,
                "Zenith Modular Solutions",
                "orders@zenithmodular.in",
                "+91 98450 67890",
                "Zenith Modular Solutions",
                "Plot 28, Electronic City Phase 1, Bengaluru 560100",
                "29AABCZ5678G2Z1",
                LocalDateTime.now()
        ));

        customerRepository.save(new Customer(
                null,
                "Horizon Commercial Furnishings",
                "info@horizonfurnishings.com",
                "+91 98110 54321",
                "Horizon Commercial Furnishings",
                "Sector 62, Commercial Complex, Noida 201309",
                "07AABCH9012K3Z8",
                LocalDateTime.now()
        ));
    }

    private void seedMaterialsAndSuppliersAndProducts() {
        if (materialRepository.count() > 0) {
            return;
        }

        // 1. Raw Materials matching requirements
        Material steel = materialRepository.save(new Material(
                null, "MAT-STL-01", "Steel", "kg",
                BigDecimal.valueOf(1500.00), BigDecimal.ZERO, BigDecimal.valueOf(500.00), LocalDateTime.now()
        ));

        Material wood = materialRepository.save(new Material(
                null, "MAT-WOD-02", "Wood", "kg",
                BigDecimal.valueOf(1200.00), BigDecimal.ZERO, BigDecimal.valueOf(300.00), LocalDateTime.now()
        ));

        Material paint = materialRepository.save(new Material(
                null, "MAT-PNT-03", "Paint", "litre",
                BigDecimal.valueOf(300.00), BigDecimal.ZERO, BigDecimal.valueOf(100.00), LocalDateTime.now()
        ));

        Material fasteners = materialRepository.save(new Material(
                null, "MAT-FST-04", "Screws & Fasteners", "pcs",
                BigDecimal.valueOf(10000.00), BigDecimal.ZERO, BigDecimal.valueOf(2000.00), LocalDateTime.now()
        ));

        Material cushionFoam = materialRepository.save(new Material(
                null, "MAT-FMA-05", "Cushion Foam", "metre",
                BigDecimal.valueOf(400.00), BigDecimal.ZERO, BigDecimal.valueOf(100.00), LocalDateTime.now()
        ));

        // 2. Suppliers
        supplierRepository.save(new Supplier(
                null, "Precision Steel & Alloys Ltd", "sales@precisionsteel.com",
                "+91 98220 33445", "Precision Steel & Alloys Ltd",
                "MIDC Industrial Area, Taloja, Navi Mumbai 410208", LocalDateTime.now()
        ));

        supplierRepository.save(new Supplier(
                null, "Evergreen Timber & Wood Works", "contact@evergreentimber.com",
                "+91 97110 88776", "Evergreen Timber & Wood Works",
                "Sawmill Road, Lakadganj, Nagpur 440008", LocalDateTime.now()
        ));

        supplierRepository.save(new Supplier(
                null, "Industrial Coatings & Chemicals", "orders@industrialcoatings.com",
                "+91 96550 44112", "Industrial Coatings & Chemicals",
                "Bhosari Industrial Estate, Pune 411026", LocalDateTime.now()
        ));

        // 3. Products
        Product officeTable = productRepository.save(new Product(
                null, "PRD-OT-001", "Office Table",
                "Heavy-duty modular executive office table with steel frame and wood top",
                "Furniture", BigDecimal.valueOf(1250.00), LocalDateTime.now()
        ));

        Product ergonomicChair = productRepository.save(new Product(
                null, "PRD-EC-002", "Ergonomic Chair",
                "High-back executive ergonomic mesh chair with padded cushion",
                "Furniture", BigDecimal.valueOf(850.00), LocalDateTime.now()
        ));

        Product filingCabinet = productRepository.save(new Product(
                null, "PRD-FC-003", "Metal Filing Cabinet",
                "Four-drawer powder-coated steel office storage filing cabinet",
                "Storage", BigDecimal.valueOf(1500.00), LocalDateTime.now()
        ));

        // 4. BOMs
        // Office Table BOM: 20 kg Steel, 10 kg Wood, 2 litre Paint
        BOM tableBom = new BOM();
        tableBom.setProduct(officeTable);
        tableBom.setVersion("v1.0");
        tableBom.setActive(true);
        tableBom.addItem(new BOMItem(null, tableBom, steel, BigDecimal.valueOf(20.0)));
        tableBom.addItem(new BOMItem(null, tableBom, wood, BigDecimal.valueOf(10.0)));
        tableBom.addItem(new BOMItem(null, tableBom, paint, BigDecimal.valueOf(2.0)));
        bomRepository.save(tableBom);

        // Ergonomic Chair BOM: 5 kg Steel, 2 metre Cushion Foam, 16 pcs Fasteners
        BOM chairBom = new BOM();
        chairBom.setProduct(ergonomicChair);
        chairBom.setVersion("v1.0");
        chairBom.setActive(true);
        chairBom.addItem(new BOMItem(null, chairBom, steel, BigDecimal.valueOf(5.0)));
        chairBom.addItem(new BOMItem(null, chairBom, cushionFoam, BigDecimal.valueOf(2.0)));
        chairBom.addItem(new BOMItem(null, chairBom, fasteners, BigDecimal.valueOf(16.0)));
        bomRepository.save(chairBom);

        // Metal Filing Cabinet BOM: 35 kg Steel, 3 litre Paint, 24 pcs Fasteners
        BOM cabinetBom = new BOM();
        cabinetBom.setProduct(filingCabinet);
        cabinetBom.setVersion("v1.0");
        cabinetBom.setActive(true);
        cabinetBom.addItem(new BOMItem(null, cabinetBom, steel, BigDecimal.valueOf(35.0)));
        cabinetBom.addItem(new BOMItem(null, cabinetBom, paint, BigDecimal.valueOf(3.0)));
        cabinetBom.addItem(new BOMItem(null, cabinetBom, fasteners, BigDecimal.valueOf(24.0)));
        bomRepository.save(cabinetBom);
    }
}
