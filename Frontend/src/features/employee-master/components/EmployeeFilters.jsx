import { departmentFilterOptions, designationFilterOptions, statusFilterOptions } from "../services/employeeOptions";
import { RotateCcw } from "lucide-react";
import { ChevronDown } from "lucide-react";
import CustomSelect from "../components/ui/CustomSelect";


const EmployeeFilters = ({
    department,
    setDepartment,
    role,
    setRole,
    status,
    setStatus,
    resetFilters, }) => {

    return (
        <div className="flex flex-wrap items-center gap-3 ">
            <div className="relative">
                <CustomSelect
                    placeholder="Department"
                    options={departmentFilterOptions()}
                    value={department}
                    onValueChange={setDepartment}
                />
                <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
                />

            </div>

            <div className="relative">
                <CustomSelect
                    placeholder="Role"
                    options={designationFilterOptions()}
                    value={role}
                    onValueChange={setRole}
                />
                <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
                />
            </div>

            <div className="relative">
                <CustomSelect
                    placeholder="All Status"
                    options={statusFilterOptions()}
                    value={status}
                    onValueChange={setStatus}
                />
                <ChevronDown
                    size={18}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
                />
            </div>

            <button

                className="flex items-center gap-2 rounded-xl
                           border border-[var(--color-border)]
                           bg-[var(--color-secondary)]
                           px-5 h-12
                           transition-all duration-300
                           hover:border-[var(--color-primary)]
                           hover:text-[var(--color-primary)]"
                onClick={() => 
                    resetFilters()
                }
            >
                <RotateCcw size={16} className="text-[var(--color-primary)]" />
                <span> Reset Filters</span>

            </button>

        </div>
    );
};

export default EmployeeFilters;
