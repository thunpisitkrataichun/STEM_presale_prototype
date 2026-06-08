import {
  createContext, useContext, useState, useCallback,
  type ReactNode,
} from "react";
import { MACHINES, type MachinePrediction } from "../../data/modelData";
import { parseXlsx, type ParseError } from "../lib/xlsxParser";
import {
  deriveFailureData, deriveSeedJobs,
  STATIC_FAILURE, STATIC_MAINTENANCE,
  type DerivedFailureData, type FailureKpis,
} from "../lib/deriveData";
import { type MaintenanceJob } from "../../data/maintenanceData";
import { type FailureComponent, type FailureEvent, type WeeklyPoint } from "../../data/failureData";

export type { FailureKpis, DerivedFailureData };
export type { FailureComponent, FailureEvent, WeeklyPoint };

interface UploadInfo {
  filename: string;
  rowCount: number;
  loadedAt: string;
}

interface DataContextValue {
  // Machine fleet
  machines: MachinePrediction[];
  setMachines: (m: MachinePrediction[]) => void;
  addMachine: (m: MachinePrediction) => void;
  deleteMachine: (id: string) => void;

  // Upload state
  uploadInfo: UploadInfo | null;
  isUploading: boolean;
  uploadError: ParseError | null;
  loadFromXlsx: (file: File) => Promise<void>;
  resetToDefault: () => void;

  // Failure Analysis derived data
  failureEvents: FailureEvent[];
  failureKpis: FailureKpis;
  failureByComponent: Record<FailureComponent, number>;
  topOffenders: { machineID: string; count: number }[];
  weeklyTrend: WeeklyPoint[];
  heatmap: number[][];
  heatmapMax: number;

  // Maintenance derived data
  seedJobs: MaintenanceJob[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataContextProvider({ children }: { children: ReactNode }) {
  const [machines, setMachinesRaw] = useState<MachinePrediction[]>(MACHINES);
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<ParseError | null>(null);
  const [failure, setFailure] = useState<DerivedFailureData>(STATIC_FAILURE);
  const [seedJobs, setSeedJobs] = useState<MaintenanceJob[]>(STATIC_MAINTENANCE);

  // Re-derive when machines change (only after a file upload)
  const applyMachines = useCallback(
    (next: MachinePrediction[], fromUpload: boolean) => {
      setMachinesRaw(next);
      if (fromUpload) {
        setFailure(deriveFailureData(next));
        setSeedJobs(deriveSeedJobs(next));
      }
    },
    [],
  );

  const setMachines = useCallback((m: MachinePrediction[]) => {
    setMachinesRaw(m);
  }, []);

  const addMachine = useCallback((m: MachinePrediction) => {
    setMachinesRaw(prev => [...prev, m]);
  }, []);

  const deleteMachine = useCallback((id: string) => {
    setMachinesRaw(prev => prev.filter(m => m.machineID !== id));
  }, []);

  const loadFromXlsx = useCallback(async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await parseXlsx(file);
      applyMachines(result.machines, true);
      setUploadInfo({
        filename: result.filename,
        rowCount: result.rowCount,
        loadedAt: new Date().toLocaleString("th-TH"),
      });
    } catch (err) {
      setUploadError(err as ParseError);
    } finally {
      setIsUploading(false);
    }
  }, [applyMachines]);

  const resetToDefault = useCallback(() => {
    setMachinesRaw(MACHINES);
    setUploadInfo(null);
    setUploadError(null);
    setFailure(STATIC_FAILURE);
    setSeedJobs(STATIC_MAINTENANCE);
  }, []);

  return (
    <DataContext.Provider
      value={{
        machines,
        setMachines,
        addMachine,
        deleteMachine,
        uploadInfo,
        isUploading,
        uploadError,
        loadFromXlsx,
        resetToDefault,
        failureEvents: failure.failureEvents,
        failureKpis: failure.failureKpis,
        failureByComponent: failure.failureByComponent,
        topOffenders: failure.topOffenders,
        weeklyTrend: failure.weeklyTrend,
        heatmap: failure.heatmap,
        heatmapMax: failure.heatmapMax,
        seedJobs,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useDataContext must be used inside DataContextProvider");
  return ctx;
}
