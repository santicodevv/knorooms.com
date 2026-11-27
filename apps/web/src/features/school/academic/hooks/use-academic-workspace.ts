"use client";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  assignTeacher,
  closeAcademicYear,
  createAcademicYear,
  createGradeLevel,
  createSchoolSection,
  createSubject,
  fetchAcademicOverview,
  reopenAcademicYear,
} from "../api/academic-api";
import {
  assignTeacherSchema,
  createAcademicYearSchema,
  createGradeLevelSchema,
  createSchoolSectionSchema,
  createSubjectSchema,
  type AssignTeacherFormValues,
  type CreateAcademicYearFormValues,
  type CreateGradeLevelFormValues,
  type CreateSchoolSectionFormValues,
  type CreateSubjectFormValues,
} from "../schemas/academic-schemas";
import {
  filterAcademicSubjects,
  groupTeacherAssignments,
  selectAcademicSections,
  type AcademicSectionCapacity,
} from "../schemas/academic-view";
import type { AcademicStructureOverviewDto, ApiResult, ProblemDetails } from "@/lib/api/types";

export type AcademicWorkspaceView = "grades-sections" | "years" | "subjects" | "assignments";
export type AcademicDrawerKind = "year" | "grade" | "section" | "subject" | "assignment" | null;
export interface AcademicFeedbackState {
  tone: "success" | "error";
  title: string;
  detail?: string;
  status?: number;
}
interface UseAcademicWorkspaceParams {
  initialOverview: AcademicStructureOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  canReadAcademic?: boolean;
  overviewAvailable?: boolean;
  initialSectionCapacities?: AcademicSectionCapacity[] | null;
}
export function useAcademicWorkspace({
  initialOverview,
  initialProblem,
  csrfToken,
  canReadAcademic = false,
  overviewAvailable: initialAvailable = false,
  initialSectionCapacities = null,
}: UseAcademicWorkspaceParams) {
  const router = useRouter();
  const [overview, setOverview] = useState(initialOverview);
  const [overviewAvailable, setOverviewAvailable] = useState(initialAvailable);
  const [problem, setProblem] = useState(initialProblem);
  const [feedback, setFeedback] = useState<AcademicFeedbackState | null>(null);
  const [activeView, setActiveView] = useState<AcademicWorkspaceView>("years");
  const [openDrawer, setOpenDrawer] = useState<AcademicDrawerKind>(null);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [assignmentView, setAssignmentView] = useState("section");
  const [confirmation, setConfirmation] = useState<{
    id: string;
    code: string;
    closed: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultYear =
    initialOverview.academicYears.find((item) => !item.isClosed)?.id ??
    initialOverview.academicYears[0]?.id ??
    "";
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState(defaultYear);
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState(
    initialOverview.gradeLevels[0]?.id ?? "",
  );
  const [gradeFilterId, setGradeFilterId] = useState("all");
  const yearForm = useForm<CreateAcademicYearFormValues>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { code: "", name: "", startDate: "", endDate: "" },
  });
  const gradeForm = useForm<CreateGradeLevelFormValues>({
    resolver: zodResolver(createGradeLevelSchema),
    defaultValues: { stage: undefined, officialGradeNumber: undefined, code: "", displayName: "" },
  });
  const sectionForm = useForm<CreateSchoolSectionFormValues>({
    resolver: zodResolver(createSchoolSectionSchema),
    defaultValues: {
      academicYearId: defaultYear,
      gradeLevelId: initialOverview.gradeLevels[0]?.id ?? "",
      code: "",
      shift: "Morning",
      capacity: undefined,
    },
  });
  const subjectForm = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { code: "", name: "" },
  });
  const assignmentForm = useForm<AssignTeacherFormValues>({
    resolver: zodResolver(assignTeacherSchema),
    defaultValues: {
      sectionId: "",
      subjectId: "",
      teacherMembershipId: "",
      weeklyHours: undefined,
    },
  });
  const gradeStage = useWatch({ control: gradeForm.control, name: "stage" });
  const refresh = useCallback(async () => {
    if (!canReadAcademic) {
      router.refresh();
      return;
    }
    const result = await fetchAcademicOverview();
    if (result.ok) {
      setOverview(result.data);
      setOverviewAvailable(true);
      setProblem(null);
    } else {
      setProblem({ ...result.problem, status: result.status });
      setOverviewAvailable(false);
    }
  }, [canReadAcademic, router]);
  const handleRefresh = () =>
    startTransition(async () => {
      await refresh();
      router.refresh();
    });
  function closeDrawer() {
    if (isPending) return;
    setOpenDrawer(null);
    if (window.location.pathname.endsWith("/new")) {
      const area = window.location.pathname.split("/")[2];
      router.replace("/academic/" + (area === "sections" ? "grades" : area));
    }
  }
  const toggleDrawer = (drawer: Exclude<AcademicDrawerKind, null>) => {
    setFeedback(null);
    if (drawer === "section") {
      sectionForm.setValue(
        "academicYearId",
        selectedAcademicYearId === "all"
          ? (overview.academicYears.find((item) => !item.isClosed)?.id ?? "")
          : selectedAcademicYearId,
      );
      sectionForm.setValue(
        "gradeLevelId",
        selectedGradeLevelId === "all" ? (overview.gradeLevels[0]?.id ?? "") : selectedGradeLevelId,
      );
    }
    setOpenDrawer(drawer);
  };
  function runMutation<T>(
    operation: () => Promise<ApiResult<T>>,
    title: (data: T) => string,
    after?: (data: T) => void,
  ) {
    if (isPending) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await operation();
      if (!result.ok) {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          detail: result.problem.detail,
          status: result.status,
        });
        return;
      }
      setFeedback({ tone: "success", title: title(result.data) });
      after?.(result.data);
      setOpenDrawer(null);
      setConfirmation(null);
      await refresh();
      if (window.location.pathname.endsWith("/new")) {
        const area = window.location.pathname.split("/")[2];
        router.replace("/academic/" + (area === "sections" ? "grades" : area));
      }
    });
  }
  const submitCreateYear = yearForm.handleSubmit((values) =>
    runMutation(
      () => createAcademicYear(values, csrfToken),
      (item) => "Año escolar " + item.code + " creado",
      (item) => {
        setSelectedAcademicYearId(item.id);
        yearForm.reset();
      },
    ),
  );
  const submitCreateGradeLevel = gradeForm.handleSubmit((values) =>
    runMutation(
      () => createGradeLevel(values, csrfToken),
      (item) => "Grado " + item.code + " registrado",
      (item) => {
        setSelectedGradeLevelId(item.id);
        gradeForm.reset();
      },
    ),
  );
  const submitCreateSection = sectionForm.handleSubmit((values) =>
    runMutation(
      () => createSchoolSection(values, csrfToken),
      (item) => "Sección " + item.code + " creada",
      () => sectionForm.reset(),
    ),
  );
  const submitCreateSubject = subjectForm.handleSubmit((values) =>
    runMutation(
      () => createSubject(values, csrfToken),
      (item) => "Materia " + item.name + " registrada",
      () => subjectForm.reset(),
    ),
  );
  const submitAssignTeacher = assignmentForm.handleSubmit((values) =>
    runMutation(
      () => assignTeacher(values, csrfToken),
      () => "Docente asignado",
      () => assignmentForm.reset(),
    ),
  );
  const handleToggleYearStatus = (id: string, code: string, closed: boolean) => {
    setFeedback(null);
    setConfirmation({ id, code, closed });
  };
  const confirmYearStatus = () => {
    if (confirmation)
      runMutation(
        () =>
          confirmation.closed
            ? reopenAcademicYear(confirmation.id, csrfToken)
            : closeAcademicYear(confirmation.id, csrfToken),
        () => (confirmation.closed ? "Año escolar reabierto" : "Año escolar cerrado"),
      );
  };
  const activeAcademicYear =
    overview.academicYears.find((item) => item.id === selectedAcademicYearId) ?? null;
  const filteredSections = useMemo(
    () => selectAcademicSections(overview.sections, selectedAcademicYearId, selectedGradeLevelId),
    [overview.sections, selectedAcademicYearId, selectedGradeLevelId],
  );
  const filteredAssignments = useMemo(
    () =>
      overview.teacherAssignments.filter(
        (item) =>
          selectedAcademicYearId === "all" || item.academicYearId === selectedAcademicYearId,
      ),
    [overview.teacherAssignments, selectedAcademicYearId],
  );
  const filteredSubjects = useMemo(
    () => filterAcademicSubjects(overview.subjects, subjectSearchQuery),
    [overview.subjects, subjectSearchQuery],
  );
  const teacherGroups = useMemo(
    () => groupTeacherAssignments(filteredAssignments),
    [filteredAssignments],
  );
  const availableSections = overview.sections.filter((item) =>
    overview.academicYears.some((year) => year.id === item.academicYearId && !year.isClosed),
  );
  return {
    overview,
    overviewAvailable,
    canReadAcademic,
    problem,
    feedback,
    activeView,
    setActiveView,
    openDrawer,
    setOpenDrawer,
    toggleDrawer,
    closeDrawer,
    selectedAcademicYearId,
    setSelectedAcademicYearId,
    selectedGradeLevelId,
    setSelectedGradeLevelId,
    gradeFilterId,
    setGradeFilterId,
    subjectSearchQuery,
    setSubjectSearchQuery,
    assignmentView,
    setAssignmentView,
    activeAcademicYear,
    filteredSections,
    filteredAssignments,
    filteredSubjects,
    teacherGroups,
    availableSections,
    sectionCapacities: initialSectionCapacities,
    totalSeatCapacity: filteredSections.reduce((sum, item) => sum + item.capacity, 0),
    totalWeeklyHoursAssigned: filteredAssignments.reduce((sum, item) => sum + item.weeklyHours, 0),
    isPending,
    actionLoadingId: isPending ? (confirmation?.id ?? null) : null,
    handleRefresh,
    handleToggleYearStatus,
    confirmation,
    confirmYearStatus,
    closeConfirmation: () => {
      if (!isPending) setConfirmation(null);
    },
    yearForm,
    submitCreateYear,
    gradeForm,
    gradeStage,
    submitCreateGradeLevel,
    sectionForm,
    submitCreateSection,
    subjectForm,
    submitCreateSubject,
    assignmentForm,
    submitAssignTeacher,
  };
}
export type AcademicState = ReturnType<typeof useAcademicWorkspace>;
