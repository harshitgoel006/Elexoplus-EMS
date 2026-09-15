import ROLES from "../../../config/roles";


const MOCK_USERS = [
  {
    id: 1,
    username: "admin",
    password: "Elexo@123",
    role: ROLES.ADMIN,
    name: "Harshit Goel",
    email: "admin@elexoplus.com",
    designation: "Administrator",
    avatar: null,
    status: "System Live",
  },

  {
    id: 2,
    username: "sakshi.hr",
    password: "Elexo@123",
    role: ROLES.HR,
    name: "Sakshi Bansal",
    email: "sakshi@elexoplus.com",
    designation: "HR Manager",
    avatar: null,
    status: "System Live",
  },

  {
    id: 3,
    username: "gaurav.asm",
    password: "Elexo@123",
    role: ROLES.ASM,
    name: "Gaurav Kumar",
    email: "gaurav@elexoplus.com",
    designation: "Area Sales Manager",
    avatar: null,
    status: "System Live",
  },

  {
    id: 4,
    employeeCode: "EMP004",
    asmId: "EMP003",
    username: "nisha.se",
    password: "Elexo@123",
    role: ROLES.SALES_EXECUTIVE,
    name: "Nisha Barnwal",
    email: "nisha@elexoplus.com",
    designation: "Sales Executive",
    avatar: null,
    status: "System Live",
  },

  {
    id: 5,
    employeeCode: "EMP005",
    asmId: "EMP003",
    username: "niyati.se",
    password: "Elexo@123",
    role: ROLES.SALES_EXECUTIVE,
    name: "Niyati Kansal",
    email: "niyati@elexoplus.com",
    designation: "Sales Executive",
    avatar: null,
    status: "System Live",
  },
];

export default MOCK_USERS;
