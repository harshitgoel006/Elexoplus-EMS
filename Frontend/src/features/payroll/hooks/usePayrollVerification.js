import { useState, useEffect } from "react";
import { payrollService } from "../services/payrollService";

export const usePayrollVerification = () => {
  const [pendingRecords, setPendingRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    loadPendingPayroll();
  }, []);

  const loadPendingPayroll = async () => {
    try {
      const response = await payrollService.getPayrollRecords();
      const pending = response.data.filter(
        (rec) => rec.status.toLowerCase() !== "processed"
      );
      setPendingRecords(pending);
    } catch (error) {
      console.error("Failed to load payroll records:", error);
    }
  };

  const handleFinalProcess = async (payrollId) => {
    try {
      await payrollService.processPayroll(payrollId);
      setPendingRecords((prev) => prev.filter((rec) => rec.id !== payrollId));
      setSelectedRecord(null);
    } catch (error) {
      console.error("Failed to process payroll:", error);
    }
  };

  const filteredRecords = pendingRecords.filter(
    (rec) =>
      rec.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    pendingRecords: filteredRecords,
    searchTerm,
    setSearchTerm,
    selectedRecord,
    setSelectedRecord,
    handleFinalProcess,
  };
};
