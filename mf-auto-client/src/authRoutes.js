// import Register from "views/examples/Register";
import Login from "./views/pages/Login";
const authRoutes = [
    {
        path: "/login",
        name: "Login",
        rtlName: "لوحة القيادة",
        component: Login,
        layout: "/auth",
    },
];

export default authRoutes;