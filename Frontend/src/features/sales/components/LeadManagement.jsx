import { useEffect, useState } from "react";
import { ActivityTimeline } from "./ActivityTimeline";
import { SalesAnalytics } from "./SalesAnalytics";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { LeadsPDFDocument } from "../../../../src/utils/pdfGenerator";
import { ArrowDownToLine } from "lucide-react";
import { SalesTargets } from "./SalesTargets";
import CustomSelect from "../../employee-master/components/ui/CustomSelect";
import InlineLoader from "../../../components/common/InlineLoader";
import { salesApi } from "../services/salesApi";

// static configurations for re-assignment drop-downs
const REGIONS_LIST = ["North", "West", "East", "South", "Central"];
const EXECUTIVES_LIST = ["Harshit Goel", "Rohit Verma", "Neha Raj", "Amit", "Unassigned"];

export default function LeadManagement({ role = "Admin" }) { // taking role from props, default to Admin
  const currentRole = role === "SALES_EXECUTIVE" ? "se" : role.toLowerCase();

  const [leads, setLeads] = useState([]); /* Legacy sample data retained only as commented reference:
    {
      id: 1,
      name: "Amit Sharma",
      company: "Rudra Industries",
      type: "B2B",
      phone: "9876543210",
      email: "amit@rudra.com",
      source: "Distributor Ref",
      region: "North",
      assignedTo: "Harshit Goel",
      status: "New",
      value: "₹5,00,000",
      nextFollowUp: "2026-07-10",
      activities: [
        { id: 101, type: "System", note: "New lead profile created in database.", user: "System Log", time: "10:30 AM" }
      ]
    },
    {
      id: 2,
      name: "Priya Patel",
      company: "—",
      type: "B2C",
      phone: "8765432109",
      email: "priya.patel@gmail.com",
      source: "Instagram Ad",
      region: "West",
      assignedTo: "Rohit Verma",
      status: "Contacted",
      value: "₹18,500",
      nextFollowUp: "2026-07-15",
      activities: [
        { id: 102, type: "Call", note: "Discussed corporate hub setup and bulk container pricing options.", user: "Neha Raj", time: "Yesterday" }
      ]
    },
    { id: 3, name: "Sanjay Gupta", company: "Balaji Traders", type: "B2B", phone: "7654321098", email: "sanjay@balajicorp.in", source: "Website Portal", region: "Central", assignedTo: "Neha Raj", status: "Proposal Sent", value: "₹12,50,000", nextFollowUp: "2026-07-11", activities: [] },
    { id: 4, name: "Ananya Das", company: "—", type: "B2C", phone: "6543210987", email: "ananya.das@outlook.com", source: "Walk-in", region: "South", assignedTo: "Amit", status: "Converted", value: "₹35,000", nextFollowUp: "", activities: [] },
  ]); */
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);
  const [apiError, setApiError] = useState("");
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([salesApi.listLeads(), salesApi.targets()])
      .then(([leadData, targetData]) => { if (active) { setLeads(leadData.map(normalizeLead)); setTargets(targetData); } })
      .catch((error) => { if (active) { setLeads([]); setApiError(error.response?.data?.message || "Unable to load sales leads."); } })
      .finally(() => { if (active) setIsLoadingLeads(false); });
    return () => { active = false; };
  }, []);

  // Dummy Handler for Appraisal Dashboard Link
  const triggerAppraisalModal = () => {
    alert("Appraisal Hub Integration View Triggered!");
  };

  // Trinity Sub-Tabs Navigation State
  const [trinityTab, setTrinityTab] = useState("leads"); // leads | customers | orders

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showArchivedOnly] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", company: "", type: "B2B", phone: "", email: "", source: "Website", region: "North", assignedTo: "", value: "", nextFollowUp: "" });
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("All");
  const stages = ["New", "Contacted", "Proposal Sent", "Converted"];

  const formatCurrency = (val) => {
    if (!val) return "—";
    if (String(val).includes("₹")) return val;

    const numStr = String(val).replace(/[^0-9]/g, "");
    if (!numStr) return val;

    const num = parseInt(numStr, 10);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(num);
  };

  const getSystemTime = () => {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const triggerSystemLog = (leadId, logText) => {
    const newLog = {
      id: Date.now(),
      type: "System",
      note: logText,
      user: "System Log",
      time: getSystemTime()
    };

    setLeads(prevLeads => {
      const updated = prevLeads.map(l => {
        if (l.id === leadId) {
          const freshActivities = [newLog, ...(l.activities || [])];
          if (selectedLead && selectedLead.id === leadId) {
            setSelectedLead(prevSelected => ({ ...prevSelected, activities: freshActivities }));
          }
          return { ...l, activities: freshActivities };
        }
        return l;
      });
      return updated;
    });
  };

  const checkFollowUpUrgency = (dateStr, status) => {
    if (!dateStr || status === "Converted" || status === "Archived") return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      return { label: "Overdue", style: "bg-red-500/10 text-red-400 border border-red-500/20" };
    } else if (targetDate.getTime() === today.getTime()) {
      return { label: "Today", style: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
    }
    return null;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "New": return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "Contacted": return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      case "Proposal Sent": return "bg-purple-500/20 text-purple-400 border border-purple-500/30";
      case "Converted": return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
      case "Archived": return "bg-zinc-800 text-zinc-400 border border-zinc-700";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStageHeaderColor = (stage) => {
    switch (stage) {
      case "New": return "border-t-blue-500";
      case "Contacted": return "border-t-orange-500";
      case "Proposal Sent": return "border-t-purple-500";
      case "Converted": return "border-t-emerald-500";
      default: return "border-t-zinc-700";
    }
  };

  const handleAddLead = async (e) => {
    e.preventDefault();
    try {
      const created = await salesApi.createLead({
        segment: newLead.type,
        lead_name: newLead.name,
        company_name: newLead.type === "B2C" ? "" : newLead.company,
        phone_number: newLead.phone,
        email: newLead.email,
        lead_source: newLead.source,
        region: newLead.region,
        estimated_value: String(newLead.value).replace(/[^0-9.]/g, "") || 0,
        next_follow_up_date: newLead.nextFollowUp,
        assigned_to: newLead.assignedTo,
      });
      setLeads((current) => [normalizeLead(created), ...current]);
    } catch (error) {
      setApiError(error.response?.data?.message || "Unable to create lead.");
      return;
    }

    setShowModal(false);
    setNewLead({ name: "", company: "", type: "B2B", phone: "", email: "", source: "Website", region: "North", assignedTo: "", value: "", nextFollowUp: "" });
  };

  const handleUpdateActivities = (leadId, updatedActivities) => {
    const updatedLeads = leads.map(l => l.id === leadId ? { ...l, activities: updatedActivities } : l);
    setLeads(updatedLeads);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead({ ...selectedLead, activities: updatedActivities });
    }
  };

  function normalizeLead(lead) {
    return {
    ...lead,
    id: lead.id || lead.lead_id || `lead-${Date.now()}`,
    name: lead.name || lead.lead_name || "Unnamed lead",
    company: lead.company || lead.company_name || "—",
    type: lead.type || lead.segment || "B2B",
    phone: lead.phone || lead.phone_number || "",
    email: lead.email || "",
    source: lead.source || lead.lead_source || "Website",
    region: lead.region || "Unassigned",
    assignedTo: lead.assignedTo || lead.assigned_to || lead.assignedSeName || "Unassigned",
    status: lead.status || lead.current_status || "New",
    value: formatCurrency(lead.value ?? lead.estimated_value),
    nextFollowUp: lead.nextFollowUp || lead.next_follow_up_date || "",
    activities: lead.activities || [],
    };
  }

  const updateLead = async (leadId, payload) => {
    try {
      const updated = await salesApi.updateLead(leadId, payload);
      const normalized = normalizeLead(updated);
      setLeads((current) => current.map((lead) => lead.id === leadId ? { ...lead, ...normalized } : lead));
      setSelectedLead((current) => current?.id === leadId ? { ...current, ...normalized } : current);
    } catch (error) {
      setApiError(error.response?.data?.message || "Unable to update lead.");
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    const matchesType = filterType === "All" || lead.type === filterType;
    const matchesArchiveState = showArchivedOnly ? lead.status === "Archived" : lead.status !== "Archived";
    const matchesRegion = !selectedRegionFilter || selectedRegionFilter === "All" || lead.region === selectedRegionFilter;

    if (trinityTab === "customers") {
      return matchesSearch && matchesType && matchesRegion && lead.status === "Converted";
    }
    if (trinityTab === "orders") {
      return matchesSearch && matchesType && matchesRegion && lead.status === "Converted" && lead.value !== "—";
    }

    return matchesSearch && matchesType && matchesRegion && matchesArchiveState;
  });

  return (
    <div className="mt-6 relative min-h-[600px]">
      {apiError && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">{apiError}</div>}
      {isLoadingLeads && <div className="mb-4"><InlineLoader message="Loading sales data..." className="py-4" /></div>}

      <SalesAnalytics leads={leads} />
      <SalesTargets leads={leads} targets={targets} readOnly={currentRole === "hr"} />

      {/* Trinity Core Sub-Tabs Navigation */}
      <div className="flex bg-[#121212] p-1 border border-zinc-800 rounded-xl mb-6 w-full max-w-md">
        {["leads", "customers", "orders"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setTrinityTab(tab);
              if (tab !== "leads") setViewMode("table");
            }}
            className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition duration-200 ${trinityTab === tab
              ? "bg-[#FFC107] text-black shadow-md"
              : "text-zinc-400 hover:text-zinc-200"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6 bg-[#141414] p-4 rounded-xl border border-zinc-800/60 w-full">
        {/* Left Side Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start gap-3 w-full lg:w-auto flex-nowrap md:flex-wrap">
          <input
            type="text"
            placeholder={`Search ${trinityTab}...`}
            className="w-full sm:w-48 md:w-56 h-9 bg-[#1e1e1e] text-xs text-white border border-zinc-800 rounded-full px-4 focus:outline-none focus:border-[#FFC107] transition shrink-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="shrink-0">
            <CustomSelect
              options={[
                { label: "All Regions", value: "All" },
                { label: "North Region", value: "North" },
                { label: "West Region", value: "West" },
                { label: "East Region", value: "East" },
                { label: "South Region", value: "South" },
                { label: "Central Region", value: "Central" }
              ]}
              value={selectedRegionFilter || "All"}
              onValueChange={(val) => setSelectedRegionFilter(val)}
              variant="pill"
              width="w-36"
            />
          </div>

          <div className="shrink-0">
            <CustomSelect
              options={[
                { label: "All Segments", value: "All" },
                { label: "B2B Only", value: "B2B" },
                { label: "B2C Only", value: "B2C" }
              ]}
              value={filterType}
              onValueChange={(val) => setFilterType(val)}
              variant="pill"
              width="w-36"
            />
          </div>

          {trinityTab === "leads" && (
            <div className="bg-[#1e1e1e]/40 h-9 p-1 border border-zinc-800/80 rounded-full flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`h-full px-3 text-[11px] font-bold rounded-full flex items-center justify-center transition duration-150 ${viewMode === "table" ? "bg-[#FFC107] text-black" : "text-zinc-400 hover:text-white"}`}
              >
                List View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("pipeline")}
                className={`h-full px-3 text-[11px] font-bold rounded-full flex items-center justify-center transition duration-150 ${viewMode === "pipeline" ? "bg-[#FFC107] text-black" : "text-zinc-400 hover:text-white"}`}
              >
                Pipeline Board
              </button>
            </div>
          )}
        </div>


        <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 border-zinc-800/60 pt-3 lg:pt-0 shrink-0">
          <PDFDownloadLink document={<LeadsPDFDocument filteredLeads={filteredLeads} />} fileName={`Report.pdf`}>
            {({ loading }) => (
              <button className="flex items-center justify-center gap-2 px-4 h-9 bg-[#1e1e1e] text-[#FFC107] text-xs rounded-full border border-zinc-800">
                <ArrowDownToLine size={13} color="#FFC107" strokeWidth={2.5} />
                <span>{loading ? "Generating..." : `Export PDF`}</span>
              </button>
            )}
          </PDFDownloadLink>


          {trinityTab === "leads" && currentRole === "se" && (
            <button onClick={() => setShowModal(true)} className="px-4 h-9 bg-[#FFC107] text-black font-bold text-xs rounded-full">
              + Add New Lead
            </button>
          )}


          {currentRole === "hr" && (
            <button onClick={() => triggerAppraisalModal(true)} className="px-4 h-9 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs rounded-full transition">
              📊 Open Appraisal Hub
            </button>
          )}
        </div>
      </div>


      {viewMode === "table" ? (
        <div className="bg-[#161616] border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 text-sm">
                No record listings discovered inside the {trinityTab} environment.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#1a1a1a] text-zinc-400 text-sm font-medium">
                    <th className="p-4">Type</th>
                    <th className="p-4">Lead Name</th>
                    <th className="p-4">Company Name</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Region</th>
                    <th className="p-4">Assigned To</th>
                    <th className="p-4">Deal Value</th>
                    <th className="p-4">Next Follow-Up</th> {/* Added Column Header */}
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-300 text-sm divide-y divide-zinc-900">
                  {filteredLeads.map((lead) => {
                    const urgency = checkFollowUpUrgency(lead.nextFollowUp, lead.status);
                    return (
                      <tr key={lead.id} className="hover:bg-[#1c1c1c] transition cursor-pointer" onClick={() => setSelectedLead(lead)}>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${lead.type === "B2B" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"}`}>
                            {lead.type}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-white">{lead.name}</td>
                        <td className="p-4 text-zinc-400">{lead.company}</td>
                        <td className="p-4 text-zinc-400 font-mono">{lead.phone}</td>
                        <td className="p-4 text-zinc-400">{lead.region}</td>
                        <td className="p-4 text-[#FFC107]">{lead.assignedTo || "Unassigned"}</td>
                        <td className="p-4 font-semibold text-zinc-100">{lead.value || "—"}</td>

                        {/* 🚀 Next Follow-Up Column with Status Badges */}
                        <td className="p-4">
                          {lead.nextFollowUp ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-zinc-300">{lead.nextFollowUp}</span>
                              {urgency && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${urgency.style}`}>
                                  {urgency.label}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-[#FFC107] font-medium bg-[#FFC107]/5 border border-[#FFC107]/20 px-3 py-1.5 rounded-lg hover:bg-[#FFC107] hover:text-black transition duration-200"
                          >
                            Configure
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start overflow-x-auto pb-4">
          {showArchivedOnly ? (
            <div className="col-span-4 bg-[#141414] border border-zinc-800 rounded-xl p-12 text-center text-zinc-500 text-sm">
              Pipeline board setup visualization is hidden while viewing Archived Leads. Please switch back to <strong>List View</strong> to manage archived logs.
            </div>
          ) : (
            stages.map((stage) => {
              const stageLeads = filteredLeads.filter((l) => l.status === stage);
              return (
                <div key={stage} className={`bg-[#141414] border border-zinc-800 border-t-2 ${getStageHeaderColor(stage)} rounded-xl p-3 min-w-[250px]`}>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{stage}</span>
                    <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full font-mono">{stageLeads.length}</span>
                  </div>

                  <div className="space-y-2.5 min-h-[350px]">
                    {stageLeads.map((lead) => {
                      const urgency = checkFollowUpUrgency(lead.nextFollowUp, lead.status);
                      return (
                        <div
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-[#1a1a1a] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3.5 cursor-pointer shadow-sm group transition-all relative overflow-hidden"
                        >
                          {urgency && (
                            <div className={`absolute top-0 left-0 right-0 h-[3px] ${urgency.label === "Overdue" ? "bg-red-500" : "bg-amber-500"}`} />
                          )}
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <h5 className="font-bold text-sm text-[#FFC107] truncate">{lead.name}</h5>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${lead.type === "B2B" ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"}`}>{lead.type}</span>
                          </div>
                          <p className="text-xs text-zinc-400 truncate mb-2">{lead.company !== "—" ? lead.company : "Retail Client"}</p>

                          {lead.nextFollowUp && (
                            <div className="mb-3 flex items-center justify-between bg-zinc-900/40 p-1.5 rounded border border-zinc-800/40">
                              <span className="text-[10px] text-zinc-500">Follow-up:</span>
                              <span className={`text-[10px] font-mono font-bold ${urgency ? (urgency.label === "Overdue" ? "text-red-400" : "text-amber-400") : "text-zinc-400"}`}>{lead.nextFollowUp}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] font-mono text-zinc-500">
                            <span>{lead.region}</span>
                            <span className="font-bold text-zinc-200">{lead.value || "—"}</span>
                          </div>
                        </div>
                      );
                    })}
                    {stageLeads.length === 0 && (
                      <div className="text-center py-12 border border-dashed border-zinc-900 rounded-xl text-xs text-zinc-600">No deals here</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* INLINE SIDE-OVER DETAILS PANEL (DRAWER) */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-[#141414] border-l border-zinc-800 shadow-2xl z-50 p-6 overflow-y-auto transform transition duration-300 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
              <div>
                <span className={`text-xs px-2 py-0.5 rounded font-bold ${selectedLead.type === "B2B" ? "bg-amber-500/10 text-amber-400" : "bg-cyan-500/10 text-cyan-400"}`}>{selectedLead.type} Profile</span>
                <h2 className="text-xl font-bold text-white mt-1">{selectedLead.name}</h2>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-zinc-400 hover:text-white text-xl font-bold">×</button>
            </div>

            <div className="bg-[#1c1c1c] rounded-xl p-4 space-y-4 mb-6 border border-zinc-800">
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Company:</span> <span className="text-white font-medium">{selectedLead.company}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Phone:</span> <span className="text-white font-mono">{selectedLead.phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-300">Email:</span> <span className="text-zinc-300">{selectedLead.email}</span></div>
              <div className="flex justify-between text-sm"><span className="text-zinc-400">Source Channel:</span> <span className="text-amber-400 text-xs bg-amber-500/10 px-2 py-0.5 rounded">{selectedLead.source}</span></div>

              {/* 🚀 Feature 2A: Dynamic Territorial Region Assignment Selector (Admin Only, HR Locked) */}
              <div className="flex justify-between text-sm items-center border-t border-zinc-900 pt-2">
                <span className="text-zinc-400">Territory Region:</span>
                {currentRole === "admin" ? (
                  <CustomSelect
                    options={[
                      { label: "North Region", value: "North" },
                      { label: "West Region", value: "West" },
                      { label: "East Region", value: "East" },
                      { label: "South Region", value: "South" },
                      { label: "Central Region", value: "Central" }
                    ]}
                    value={selectedLead.region}
                    onValueChange={(newRegion) => {
                      setSelectedLead({ ...selectedLead, region: newRegion });
                      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, region: newRegion } : l));
                      updateLead(selectedLead.id, { region: newRegion });
                      triggerSystemLog(selectedLead.id, `Region remapped to [${newRegion}].`);
                    }}
                    variant="pill"
                    width="w-40"
                  />
                ) : (
                  <span className="text-white font-medium">{selectedLead.region}</span>
                )}
              </div>

              {/* 🚀 Feature 2B: Sales Executive Agent Reassignment Selector (Admin Only, HR Locked) */}
              <div className="flex justify-between text-sm items-center">
                <span className="text-zinc-400">Assigned Executive:</span>
                {currentRole === "admin" ? (
                  <CustomSelect
                    options={[
                      { label: "Harshit Goel", value: "Harshit Goel" },
                      { label: "Rohit Verma", value: "Rohit Verma" },
                      { label: "Neha Raj", value: "Neha Raj" },
                      { label: "Unassigned", value: "Unassigned" }
                    ]}
                    value={selectedLead.assignedTo || "Unassigned"}
                    onValueChange={(newAgent) => {
                      setSelectedLead({ ...selectedLead, assignedTo: newAgent });
                      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, assignedTo: newAgent } : l));
                      updateLead(selectedLead.id, { assigned_to: newAgent });
                      triggerSystemLog(selectedLead.id, `Account reassigned to ${newAgent}.`);
                    }}
                    variant="pill"
                    width="w-40"
                  />
                ) : (
                  <span className="text-[#FFC107] font-medium">{selectedLead.assignedTo || "Unassigned"}</span>
                )}
              </div>

              {/* Deal Value Input Field - Disabled/ReadOnly for HR */}
              <div className="flex justify-between text-sm items-center border-t border-zinc-900 pt-2">
                <span className="text-zinc-400">Deal Value:</span>
                <input
                  type="text"
                  disabled={currentRole === "hr"}
                  className={`text-xs text-right text-emerald-400 font-semibold border border-zinc-700 rounded px-2 py-1 outline-none w-28 ${currentRole === "hr" ? "bg-transparent border-none cursor-not-allowed opacity-80" : "bg-[#2a2a2a] focus:border-[#FFC107]"}`}
                  value={selectedLead.value || ""}
                  onBlur={(e) => {
                    if (currentRole === "hr") return;
                    const oldVal = leads.find(l => l.id === selectedLead.id)?.value || "—";
                    const formatted = formatCurrency(e.target.value);
                    if (oldVal !== formatted) {
                      setSelectedLead({ ...selectedLead, value: formatted });
                      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, value: formatted } : l));
                      updateLead(selectedLead.id, { estimated_value: String(e.target.value).replace(/[^0-9.]/g, "") || 0 });
                      triggerSystemLog(selectedLead.id, `Deal estimated value adjusted from ${oldVal} to ${formatted}.`);
                    }
                  }}
                  onChange={(e) => {
                    if (currentRole === "hr") return;
                    setSelectedLead({ ...selectedLead, value: e.target.value });
                  }}
                />
              </div>

              {/* Follow up log trigger - Disabled/ReadOnly for HR */}
              <div className="flex justify-between text-sm items-center">
                <span className="text-zinc-400">Follow-up Date:</span>
                <input
                  type="date"
                  disabled={currentRole === "hr"}
                  className={`text-xs text-white border border-zinc-700 rounded px-2 py-1 outline-none ${currentRole === "hr" ? "bg-transparent border-none cursor-not-allowed opacity-80" : "bg-[#2a2a2a] focus:border-[#FFC107]"}`}
                  value={selectedLead.nextFollowUp || ""}
                  onChange={(e) => {
                    if (currentRole === "hr") return;
                    const newDate = e.target.value;
                    const oldDate = selectedLead.nextFollowUp || "Not Set";
                    setSelectedLead({ ...selectedLead, nextFollowUp: newDate });
                    setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, nextFollowUp: newDate } : l));
                    updateLead(selectedLead.id, { next_follow_up_date: newDate });
                    triggerSystemLog(selectedLead.id, `Follow-up timeline shifted from [${oldDate}] to [${newDate || "Cleared"}].`);
                  }}
                />
              </div>

              {/* Status log trigger - Only editable by Admin/SE roles */}
              <div className="flex justify-between text-sm items-center pt-2 border-t border-zinc-800/60">
                <span className="text-zinc-400">Update Status:</span>
                {currentRole !== "hr" ? (
                  <CustomSelect
                    options={[
                      { label: "New Lead", value: "New" },
                      { label: "Contacted", value: "Contacted" },
                      { label: "Proposal Sent", value: "Proposal Sent" },
                      { label: "Converted", value: "Converted" },
                      { label: "Archive Lead", value: "Archived" }
                    ]}
                    value={selectedLead.status}
                    onValueChange={(newStatus) => {
                      setSelectedLead({ ...selectedLead, status: newStatus });
                      setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, status: newStatus } : l));
                      updateLead(selectedLead.id, { current_status: newStatus });
                    }}
                    variant="pill"
                    width="w-40"
                  />
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusClass(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                )}
              </div>
            </div>

            {/* HR Appraisal Hook Button Addition */}
            {currentRole === "hr" && (
              <div className="mb-4 bg-[#1c1c1c] border border-dashed border-emerald-500/20 p-3 rounded-xl text-center">
                <p className="text-[11px] text-zinc-400 mb-2">Evaluate operational performance of <strong>{selectedLead.assignedTo || "Unassigned"}</strong>.</p>
                <button onClick={() => triggerAppraisalModal(true)} className="w-full h-8 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold rounded-lg transition">
                  Check Executive Appraisal Stats
                </button>
              </div>
            )}

            <div className="mt-4 border-t border-zinc-800 pt-4">
              <h4 className="text-sm font-semibold text-zinc-400 mb-3 tracking-wider uppercase">Lead Interaction & Audit Logs</h4>
              <ActivityTimeline
                activities={selectedLead.activities || []}
                onActivitiesChange={(updatedLogs) => {
                  if (currentRole === "hr") return;
                  handleUpdateActivities(selectedLead.id, updatedLogs);
                }}
                onActivityAdded={(activity) => salesApi.addActivity(selectedLead.id, { type: activity.type, note: activity.note })}
              />
            </div>
          </div>

          <button onClick={() => setSelectedLead(null)} className="mt-6 w-full bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg text-sm transition">
            Close Details
          </button>
        </div>
      )}

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#161616] border border-zinc-800 w-full max-w-md rounded-xl p-6 relative">
            <h3 className="text-xl font-bold text-white mb-4">Create New Lead Entry</h3>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Lead Type / Segment</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setNewLead({ ...newLead, type: "B2B" })} className={`p-2.5 rounded-lg border text-sm font-medium transition ${newLead.type === "B2B" ? "border-[#FFC107] bg-[#FFC107]/10 text-[#FFC107]" : "border-zinc-800 bg-[#222] text-zinc-400"}`}>B2B (Corporate)</button>
                  <button type="button" onClick={() => setNewLead({ ...newLead, type: "B2C" })} className={`p-2.5 rounded-lg border text-sm font-medium transition ${newLead.type === "B2C" ? "border-[#FFC107] bg-[#FFC107]/10 text-[#FFC107]" : "border-zinc-800 bg-[#222] text-zinc-400"}`}>B2C (Direct Consumer)</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Customer Name</label>
                <input required type="text" className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} />
              </div>
              {newLead.type === "B2B" && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Company Name</label>
                  <input required={newLead.type === "B2B"} type="text" className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none" value={newLead.company} onChange={e => setNewLead({ ...newLead, company: e.target.value })} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Phone Number</label>
                  <input required type="text" className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email Address</label>
                  <input required type="email" className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Territory Region</label>
                  <select className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none text-xs h-[42px]" value={newLead.region} onChange={e => setNewLead({ ...newLead, region: e.target.value })}>
                    {REGIONS_LIST.map(r => <option key={r} value={r}>{r} Region</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Assign Executive</label>
                  <select className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none text-xs h-[42px]" value={newLead.assignedTo} onChange={e => setNewLead({ ...newLead, assignedTo: e.target.value })}>
                    <option value="">Select Executive</option>
                    {EXECUTIVES_LIST.filter(ex => ex !== "Unassigned").map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Deal Value (Est)</label>
                  <input type="text" placeholder="e.g. 50000" className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none" value={newLead.value} onChange={e => setNewLead({ ...newLead, value: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Next Follow-up</label>
                  <input type="date" className="w-full bg-[#222] text-white border border-zinc-800 rounded-lg p-2.5 focus:border-[#FFC107] outline-none text-xs h-[42px]" value={newLead.nextFollowUp} onChange={e => setNewLead({ ...newLead, nextFollowUp: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-zinc-800 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-zinc-700 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-[#FFC107] text-black p-2.5 rounded-lg text-sm font-bold hover:bg-[#e0a800] transition">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
