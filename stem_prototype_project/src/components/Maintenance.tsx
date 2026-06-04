import { useState } from "react";
import {
  type MaintenanceJob, SEED_JOBS, todayISO,
} from "../../data/maintenanceData";

import MaintenanceHeader from "./maintenance/MaintenanceHeader";
import MaintenanceKpiSection from "./maintenance/MaintenanceKpiSection";
import MaintenanceCalendar from "./maintenance/MaintenanceCalendar";
import BookingForm from "./maintenance/BookingForm";
import UpcomingTable from "./maintenance/UpcomingTable";
import MaintenanceJobModal from "./maintenance/MaintenanceJobModal";

export default function Maintenance() {
  const [jobs, setJobs] = useState<MaintenanceJob[]>(SEED_JOBS);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [editingJob, setEditingJob] = useState<MaintenanceJob | null>(null);

  // ── Mutations ─────────────────────────────────────────────────────────
  const addJob = (draft: Omit<MaintenanceJob, "id" | "status">) => {
    const next: MaintenanceJob = {
      ...draft,
      id: `MJ-${String(jobs.length + 1).padStart(4, "0")}`,
      status: "Scheduled",
    };
    setJobs((prev) => [...prev, next]);
  };

  const updateJob = (updated: MaintenanceJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const cancelJob = (job: MaintenanceJob) => {
    updateJob({ ...job, status: "Cancelled" });
  };

  return (
    <main className="pdm-main">
      <MaintenanceHeader />
      <MaintenanceKpiSection jobs={jobs} />

      <div className="pdm-maint-row">
        <MaintenanceCalendar
          jobs={jobs}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onSelectJob={setEditingJob}
        />
        <BookingForm
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onSubmit={addJob}
        />
      </div>

      <UpcomingTable jobs={jobs} onSelectJob={setEditingJob} />

      {editingJob && (
        <MaintenanceJobModal
          job={editingJob}
          onSave={updateJob}
          onCancel={cancelJob}
          onClose={() => setEditingJob(null)}
        />
      )}
    </main>
  );
}
