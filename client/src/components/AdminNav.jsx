import { BarChart3, Boxes, CircleDollarSign, ClipboardList, CreditCard, Image, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const className = ({ isActive }) => (isActive ? 'admin-tab active' : 'admin-tab');

export const AdminNav = () => (
  <nav className="admin-tabs">
    <NavLink className={className} to="/admin" end>
      <BarChart3 size={18} />
      Dashboard
    </NavLink>
    <NavLink className={className} to="/admin/products">
      <Boxes size={18} />
      Products
    </NavLink>
    <NavLink className={className} to="/admin/orders">
      <ClipboardList size={18} />
      Orders
    </NavLink>
    <NavLink className={className} to="/admin/users">
      <Users size={18} />
      Users
    </NavLink>
    <NavLink className={className} to="/admin/currency">
      <CircleDollarSign size={18} />
      Currency
    </NavLink>
    <NavLink className={className} to="/admin/payment-methods">
      <CreditCard size={18} />
      Payments
    </NavLink>
    <NavLink className={className} to="/admin/gallery">
      <Image size={18} />
      Gallery
    </NavLink>
  </nav>
);
