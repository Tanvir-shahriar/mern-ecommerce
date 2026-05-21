import { BarChart3, Boxes, ClipboardList, Users } from 'lucide-react';
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
  </nav>
);
