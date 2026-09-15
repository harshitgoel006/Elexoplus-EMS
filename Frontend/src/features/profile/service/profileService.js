import PROFILE_PERMISSIONS from "../config/profilePermissions";
import client from "../../../api/client";
import authStorage from "../../auth/utils/authStorage";

export const getProfileData = async (role) => {
  const user = authStorage.getCurrentUser() || {};
  const name = user.name || "Employee";
  const email = user.email || "Not provided";
  return {
    profile: {
      personal: [
        { label: "Date of Birth", value: "Not provided" },
        { label: "Gender", value: "Not provided" },
        { label: "Phone", value: user.phone || "Not provided" },
      ],
      employment: [
        { label: "Employee Code", value: user.employeeCode || user.employee_code || "Not assigned" },
        { label: "Department", value: user.department || "Not assigned" },
        { label: "Reporting To", value: user.reportingManager || "Not assigned" },
        { label: "Joining Date", value: user.joiningDate || "Not provided" },
        { label: "Employment Type", value: user.employmentType || "Not assigned" },
        { label: "Work Location", value: user.workLocation || "Not assigned" },
      ],
      contact: [
        { label: "Email", value: email },
        { label: "Address", value: "Not provided" },
        { label: "City", value: "Not provided" },
        { label: "State", value: "Not provided" },
        { label: "PIN Code", value: "Not provided" },
        { label: "Work Location", value: user.workLocation || "Not assigned" },
      ],
      emergency: [],
      bank: [
        { label: "Bank Name", value: "Not provided" },
        { label: "Account Number", value: "Not provided" },
        { label: "IFSC Code", value: "Not provided" },
        { label: "PAN Number", value: "Not provided" },
      ],
      documents: [{ id: "profile-document", name: `${name.replace(/\s+/g, "-").toLowerCase()}-profile.txt`, type: "Profile document", status: "Demo" }],
    },
    permissions: PROFILE_PERMISSIONS[role] || {},
  };
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await client.post("/profile/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
};

export const openProfileDocument = async (documentId, download = false) => {
  // Profile documents are demonstration data in frontend-first mode. Password
  // changes and the signed-in profile remain backed by the real API.
  const url = URL.createObjectURL(new Blob([`Demo profile document: ${documentId}`], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.target = download ? "_self" : "_blank";
  if (download) link.download = "profile-document.txt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
