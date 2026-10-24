"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  assignTeacher,
  closeAcademicYear,
  createAcademicYear,
  createGradeLevel,
  createSchoolSection,
  createSubject,
  fetchAcademicOverview,
  reopenAcademicYear,
} from "@/features/school/academic/api/academic-api";
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
} from "@/features/school/academic/schemas/academic-schemas";
import type { AcademicStructureOverviewDto, ProblemDetails } from "@/lib/api/types";

export type AcademicWorkspaceView = "grades-sections" | "years" | "subjects" | "assignments";

export type AcademicDrawerKind = "year" | "grade" | "section" | "subject" | "assignment" | null;

export interface AcademicFeedbackState {
  tone: "success" | "error";
  title: string;
  detail?: string;
}

interface UseAcademicWorkspaceParams {
  initialOverview: AcademicStructureOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
}

export function useAcademicWorkspace({
  initialOverview,
  initialProblem,
  csrfToken,
}: UseAcademicWorkspaceParams) {
  const router = useRouter();
  const [overview, setOverview] = useState<AcademicStructureOverviewDto>(initialOverview);
  const [problem, setProblem] = useState<ProblemDetails | null>(initialProblem);
  const [feedback, setFeedback] = useState<AcademicFeedbackState | null>(null);
  const [activeView, setActiveView] = useState<AcademicWorkspaceView>("grades-sections");
  const [openDrawer, setOpenDrawer] = useState<AcademicDrawerKind>(null);
  const [subjectSearchQuery, setSubjectSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const defaultAcademicYearId = useMemo(() => {
    const openYear = overview.academicYears.find((year) => !year.isClosed);
    return openYear?.id ?? overview.academicYears[0]?.id ?? "";
  }, [overview.academicYears]);

  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>(
    () => defaultAcademicYearId || "all",
  );
  const [selectedGradeLevelId, setSelectedGradeLevelId] = useState<string>("all");

  const yearForm = useForm<CreateAcademicYearFormValues>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: {
      code: "2026-2027",
      name: "Año Escolar 2026-2027",
      startDate: "2026-08-24",
      endDate: "2027-06-25",
    },
  });

  const gradeForm = useForm<CreateGradeLevelFormValues>({
    resolver: zodResolver(createGradeLevelSchema),
    defaultValues: {
      stage: "Secondary",
      officialGradeNumber: 7,
      code: "S1",
      displayName: "1.º de Secundaria",
    },
  });

  const sectionForm = useForm<CreateSchoolSectionFormValues>({
    resolver: zodResolver(createSchoolSectionSchema),
    defaultValues: {
      academicYearId: defaultAcademicYearId,
      gradeLevelId: overview.gradeLevels[0]?.id ?? "",
      code: "A",
      shift: "Morning",
      capacity: 30,
    },
  });

  const subjectForm = useForm<CreateSubjectFormValues>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  const assignmentForm = useForm<AssignTeacherFormValues>({
    resolver: zodResolver(assignTeacherSchema),
    defaultValues: {
      sectionId: overview.sections[0]?.id ?? "",
      subjectId: overview.subjects[0]?.id ?? "",
      teacherMembershipId: "",
      weeklyHours: 4,
    },
  });

  useEffect(() => {
    const activeYearId =
      selectedAcademicYearId !== "all" ? selectedAcademicYearId : defaultAcademicYearId;
    if (activeYearId) {
      sectionForm.setValue("academicYearId", activeYearId);
    }
  }, [defaultAcademicYearId, sectionForm, selectedAcademicYearId]);

  useEffect(() => {
    if (selectedGradeLevelId !== "all") {
      sectionForm.setValue("gradeLevelId", selectedGradeLevelId);
    } else if (overview.gradeLevels[0]?.id && !sectionForm.getValues("gradeLevelId")) {
      sectionForm.setValue("gradeLevelId", overview.gradeLevels[0].id);
    }
  }, [overview.gradeLevels, sectionForm, selectedGradeLevelId]);

  const refresh = useCallback(async () => {
    const result = await fetchAcademicOverview();
    if (result.ok) {
      setOverview(result.data);
      setProblem(null);
    } else {
      setProblem(result.problem);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  const toggleDrawer = useCallback((drawer: Exclude<AcademicDrawerKind, null>) => {
    setFeedback(null);
    setOpenDrawer((current) => (current === drawer ? null : drawer));
  }, []);

  const submitCreateYear = yearForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createAcademicYear(values, csrfToken);
      if (result.ok) {
        setFeedback({
          tone: "success",
          title: `Año escolar ${result.data.code} inaugurado`,
          detail: `${result.data.name} (${result.data.startDate} → ${result.data.endDate}) quedó activo para estructurar secciones.`,
        });
        setSelectedAcademicYearId(result.data.id);
        setOpenDrawer(null);
        yearForm.reset({
          code: "",
          name: "",
          startDate: values.startDate,
          endDate: values.endDate,
        });
        await refresh();
        router.push("/academic/years");
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          detail: result.problem.detail,
        });
      }
    });
  });

  const handleToggleYearStatus = useCallback(
    (yearId: string, yearCode: string, currentlyClosed: boolean) => {
      if (!window.confirm(`¿${currentlyClosed ? "Reabrir" : "Cerrar"} el año escolar ${yearCode}?`))
        return;
      setFeedback(null);
      setActionLoadingId(yearId);
      startTransition(async () => {
        const result = currentlyClosed
          ? await reopenAcademicYear(yearId, csrfToken)
          : await closeAcademicYear(yearId, csrfToken);
        setActionLoadingId(null);

        if (result.ok) {
          setFeedback({
            tone: "success",
            title: currentlyClosed
              ? `Año escolar ${yearCode} reabierto`
              : `Año escolar ${yearCode} cerrado`,
            detail: currentlyClosed
              ? "Se habilitaron nuevamente las modificaciones estructurales en este año lectivo."
              : "El año lectivo quedó protegido contra aperturas accidentales de nuevas secciones.",
          });
          await refresh();
        } else {
          setFeedback({
            tone: "error",
            title: result.problem.title,
            detail: result.problem.detail,
          });
        }
      });
    },
    [csrfToken, refresh],
  );

  const submitCreateGradeLevel = gradeForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createGradeLevel(values, csrfToken);
      if (result.ok) {
        setFeedback({
          tone: "success",
          title: `Grado ${result.data.code} registrado`,
          detail: `${result.data.displayName} se incorporó a la estructura oficial del colegio.`,
        });
        setSelectedGradeLevelId(result.data.id);
        setOpenDrawer(null);
        gradeForm.reset({
          stage: values.stage,
          officialGradeNumber: Math.min(12, values.officialGradeNumber + 1),
          code: "",
          displayName: "",
        });
        await refresh();
        router.push("/academic/grades");
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          detail: result.problem.detail,
        });
      }
    });
  });

  const submitCreateSection = sectionForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createSchoolSection(values, csrfToken);
      if (result.ok) {
        setFeedback({
          tone: "success",
          title: `Sección ${result.data.gradeLevelCode}-${result.data.code} habilitada`,
          detail: `${result.data.gradeLevelName} · Cupo máximo de ${result.data.capacity} estudiantes.`,
        });
        setOpenDrawer(null);
        sectionForm.reset({
          ...values,
          code: "",
        });
        await refresh();
        router.push("/academic/grades");
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          detail: result.problem.detail,
        });
      }
    });
  });

  const submitCreateSubject = subjectForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createSubject(values, csrfToken);
      if (result.ok) {
        setFeedback({
          tone: "success",
          title: `Asignatura ${result.data.code} agregada al catálogo`,
          detail: `${result.data.name} ya puede asignarse a las secciones activas.`,
        });
        setOpenDrawer(null);
        subjectForm.reset({ code: "", name: "" });
        await refresh();
        router.push("/academic/subjects");
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          detail: result.problem.detail,
        });
      }
    });
  });

  const submitAssignTeacher = assignmentForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await assignTeacher(values, csrfToken);
      if (result.ok) {
        setFeedback({
          tone: "success",
          title: "Carga académica docente asignada",
          detail: `${result.data.teacherDisplayName} asumió ${result.data.subjectName} en ${result.data.gradeLevelName} (${result.data.sectionCode}) con ${result.data.weeklyHours}h/semana.`,
        });
        setOpenDrawer(null);
        await refresh();
        router.push("/academic/assignments");
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          detail: result.problem.detail,
        });
      }
    });
  });

  const activeAcademicYear = useMemo(() => {
    if (selectedAcademicYearId === "all") {
      return (
        overview.academicYears.find((year) => !year.isClosed) ?? overview.academicYears[0] ?? null
      );
    }
    return overview.academicYears.find((year) => year.id === selectedAcademicYearId) ?? null;
  }, [overview.academicYears, selectedAcademicYearId]);

  const filteredSections = useMemo(() => {
    return overview.sections.filter((section) => {
      const matchesYear =
        selectedAcademicYearId === "all" || section.academicYearId === selectedAcademicYearId;
      const matchesGrade =
        selectedGradeLevelId === "all" || section.gradeLevelId === selectedGradeLevelId;
      return matchesYear && matchesGrade;
    });
  }, [overview.sections, selectedAcademicYearId, selectedGradeLevelId]);

  const filteredAssignments = useMemo(() => {
    return overview.teacherAssignments.filter((assignment) => {
      return (
        selectedAcademicYearId === "all" || assignment.academicYearId === selectedAcademicYearId
      );
    });
  }, [overview.teacherAssignments, selectedAcademicYearId]);

  const filteredSubjects = useMemo(() => {
    const query = subjectSearchQuery.trim().toLowerCase();
    if (!query) {
      return overview.subjects;
    }
    return overview.subjects.filter(
      (subject) =>
        subject.code.toLowerCase().includes(query) || subject.name.toLowerCase().includes(query),
    );
  }, [overview.subjects, subjectSearchQuery]);

  const totalSeatCapacity = useMemo(() => {
    return filteredSections.reduce((acc, section) => acc + section.capacity, 0);
  }, [filteredSections]);

  const totalWeeklyHoursAssigned = useMemo(() => {
    return filteredAssignments.reduce((acc, item) => acc + item.weeklyHours, 0);
  }, [filteredAssignments]);

  return {
    overview,
    problem,
    feedback,
    activeView,
    setActiveView,
    openDrawer,
    setOpenDrawer,
    toggleDrawer,
    selectedAcademicYearId,
    setSelectedAcademicYearId,
    selectedGradeLevelId,
    setSelectedGradeLevelId,
    subjectSearchQuery,
    setSubjectSearchQuery,
    activeAcademicYear,
    filteredSections,
    filteredAssignments,
    filteredSubjects,
    totalSeatCapacity,
    totalWeeklyHoursAssigned,
    isPending,
    actionLoadingId,
    handleRefresh,
    handleToggleYearStatus,
    yearForm,
    submitCreateYear,
    gradeForm,
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
