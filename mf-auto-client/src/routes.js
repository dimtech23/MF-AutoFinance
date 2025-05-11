import Dashboard from "views/pages/Dashboard.js";
import Clients from "views/pages/Clients.js";
import Budget from "views/pages/Budget.js";
import Reports from "views/pages/Reports.js";
import Invoices from "views/pages/Invoices.js";
import UserManagement from "views/pages/UserManagement.js";
import Login from "views/pages/Login.js";
import TransactionHistory from "views/pages/TransactionHistory.js";

const routes = [
  {
    path: "/dashboard",
    name: "Dashboard",
    icon: "ni ni-tv-2 text-primary",
    component: Dashboard,
    layout: "/admin",
    roles: ["Admin", "Manager", "Accountant"]
  },
  {
    path: "/clients",
    name: "Clients",
    icon: "ni ni-single-02 text-green",
    component: Clients,
    layout: "/admin",
    roles: ["Accountant", "Admin"]
  },
  {
    path: "/budget",
    name: "Budget",
    icon: "ni ni-chart-pie-35 text-orange",
    component: Budget,
    layout: "/admin",
    roles: ["Admin", "Accountant", "Manager"]
  },
  {
    path: "/reports",
    name: "Reports",
    icon: "ni ni-chart-bar-32 text-blue",
    component: Reports,
    layout: "/admin",
    roles: ["Admin", "Manager", "Accountant"]
  },
  {
    path: "/invoices",
    name: "Invoices",
    icon: "ni ni-single-copy-04 text-yellow",
    component: Invoices,
    layout: "/admin",
    roles: ["Accountant", "Admin"]
  },
  {
    path: "/transaction-history",
    name: "Transaction History",
    icon: "ni ni-bullet-list-67 text-red",
    component: TransactionHistory,
    layout: "/admin",
    roles: ["Accountant", "Admin", "Manager"]
  },
  {
    path: "/user-management",
    name: "User Management",
    icon: "ni ni-single-02 text-indigo",
    component: UserManagement,
    layout: "/admin",
    roles: ["Admin"]
  },
  {
    path: "/login",
    name: "Login",
    icon: "ni ni-key-25 text-info",
    component: Login,
    layout: "/auth"
  }
];

export default routes;