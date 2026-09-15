import { BriefcaseBusiness } from "lucide-react";

import FormInput from "../FormInput";
import FormSelect from "../FormSelect";

import {
  employeeDepartments,
  employeeDesignations,
  employeeEmploymentTypes,
  employeeStatuses,
} from "../../../services/employeeOptions";

const EmploymentSection = ({
  formData,
  handleChange,
  setFormData,
  errors,
  setErrors,
}) => {
  return (
    <div
      className="
      rounded-2xl
      border
      border-[var(--color-border)]
      bg-[var(--color-background-secondary)]
      p-7
      "
    >
      {/* Heading */}

      <div className="mb-6 flex items-center gap-3">
        <div
          className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          bg-[rgba(244,194,28,.12)]
          "
        >
          <BriefcaseBusiness
            size={22}
            className="text-[var(--color-primary)]"
          />
        </div>

        <div>
          <h3 className="text-xl font-semibold">
            Employment Information
          </h3>

          <p className="text-sm text-gray-400">
            Employee organization details
          </p>
        </div>
      </div>

      {/* Form */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormSelect
          label="Department"
          options={employeeDepartments()}
          value={formData.department}
           required
          error={errors.department}
          onChange={(value) => {
            setFormData((prev) => ({
              ...prev,
              department: value,
            }))
            setErrors((prev) => ({
              ...prev,
              department: "",
            }));
          }


          }
         
        />
        <FormSelect
          label="Designation"
          options={employeeDesignations()}
          value={formData.designation}
          onChange={(value) => { setFormData((prev) => ({
              ...prev,
              designation: value,
            }));
            setErrors((prev) => ({ ...prev, designation: "" }));
          }}
          required
          error={errors.designation}
        />

        <FormInput
          label="Reporting Manager"
          name="manager"
          placeholder="Enter Reporting Manager"
          value={formData.manager}
          onChange={handleChange}
        />

        <FormInput
          label="Joining Date"
          type="date"
          name="joiningDate"
          value={formData.joiningDate}
          onChange={handleChange}
          required
          error={errors.joiningDate}

        />
        <FormSelect
          label="Employment Type"
          options={employeeEmploymentTypes()}
          value={formData.employmentType}
          required
          error={errors.employmentType}
          onChange={(value) =>{
            setFormData((prev) => ({
              ...prev,
              employmentType: value,
            }))
            setErrors((prev) => ({
              ...prev,
              employmentType: "",
            }));}
            
          }
        />

        <FormSelect
          label="Work Location"
          options={["Head Office", "Delhi", "Remote"]}
          value={formData.location}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, location: value }));
            setErrors((prev) => ({ ...prev, location: "" }));
          }}
          required
          error={errors.location}
        />
        <FormSelect
          label="Employee Status"
          options={employeeStatuses()}
          value={formData.status}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, status: value }));
            setErrors((prev) => ({ ...prev, status: "" }));
          }}
        />
      </div>
    </div>
  );
};

export default EmploymentSection;
