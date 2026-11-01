import React from 'react';

const STATUS_STYLES = {
  // Sales Order & General Workflow Statuses
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
  CONFIRMED: 'bg-sky-50 text-sky-700 border-sky-300',
  MATERIAL_CHECK: 'bg-amber-50 text-amber-700 border-amber-300',
  SHORTAGE: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
  READY_FOR_PRODUCTION: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
  IN_PRODUCTION: 'bg-amber-100 text-amber-800 border-amber-300',
  COMPLETED: 'bg-teal-50 text-teal-700 border-teal-300',
  INVOICED: 'bg-indigo-50 text-indigo-700 border-indigo-300',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800 border-amber-300',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-300 line-through',

  // Purchase Order
  ORDERED: 'bg-blue-50 text-blue-700 border-blue-300',
  RECEIVED: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',

  // Production Order
  PLANNED: 'bg-sky-50 text-sky-700 border-sky-300',
  IN_PROGRESS: 'bg-orange-100 text-orange-800 border-orange-300',

  // Invoice
  ISSUED: 'bg-blue-50 text-blue-700 border-blue-300',
  OVERDUE: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',

  // Inventory Stock
  'LOW STOCK': 'bg-rose-100 text-rose-700 border-rose-300 font-semibold',
  'IN STOCK': 'bg-emerald-50 text-emerald-700 border-emerald-300',
  SUFFICIENT: 'bg-emerald-50 text-emerald-700 border-emerald-300',
};

export const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();
  const style = STATUS_STYLES[normalized] || 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
