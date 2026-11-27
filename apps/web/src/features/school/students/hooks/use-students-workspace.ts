"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { filterStudents } from "../schemas/student-directory";
import {
  activateStudent,
  createGuardian,
  createStudent,
  deactivateStudent,
  enrollStudent,
  fetchEnrollmentsOverview,
  fetchStudentDirectoryOverview,
  linkStudentGuardian,
  transferStudentSection,
  withdrawEnrollment,
} from "@/features/school/students/api/students-api";
import {
  createGuardianSchema,
  createStudentSchema,
  enrollStudentSchema,
  linkStudentGuardianSchema,
  transferStudentSectionSchema,
  type CreateGuardianFormValues,
  type CreateStudentFormValues,
  type EnrollStudentFormValues,
  type LinkStudentGuardianFormValues,
  type TransferStudentSectionFormValues,
} from "@/features/school/students/schemas/students-schemas";
import type {
  EnrollmentsOverviewDto,
  ProblemDetails,
  StudentDirectoryOverviewDto,
  StudentEnrollmentDto,
} from "@/lib/api/types";

export type StudentsWorkspaceView = "directory" | "enrollments" | "guardians";

export type StudentsDrawerKind =
  "student" | "guardian" | "link-guardian" | "enroll" | "transfer" | null;

export type StudentStatusFilter = "all" | "active" | "inactive" | "unassigned";

export interface StudentsFeedbackState {
  tone: "success" | "error";
  title: string;
  detail?: string;
  studentId?: string;
  status?: number;
}

interface UseStudentsWorkspaceParams {
  initialDirectory: StudentDirectoryOverviewDto;
  initialEnrollments: EnrollmentsOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
  studentId?: string;
  canReadStudents?: boolean;
  canReadEnrollments?: boolean;
  directoryAvailable?: boolean;
  enrollmentsAvailable?: boolean;
}

export function useStudentsWorkspace({
  initialDirectory,
  initialEnrollments,
  initialProblem,
  csrfToken,
  studentId,
  canReadStudents = false,
  canReadEnrollments = false,
  directoryAvailable: initialDirectoryAvailable = false,
  enrollmentsAvailable: initialEnrollmentsAvailable = false,
}: UseStudentsWorkspaceParams) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [directory, setDirectory] = useState<StudentDirectoryOverviewDto>(initialDirectory);
  const [enrollmentsOverview, setEnrollmentsOverview] =
    useState<EnrollmentsOverviewDto>(initialEnrollments);
  const [problem, setProblem] = useState<ProblemDetails | null>(initialProblem);
  const [feedback, setFeedback] = useState<StudentsFeedbackState | null>(null);
  const [activeView, setActiveView] = useState<StudentsWorkspaceView>("directory");
  const [openDrawer, setOpenDrawer] = useState<StudentsDrawerKind>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    () => studentId ?? initialDirectory.students[0]?.id ?? null,
  );
  const [studentSearchQuery, setStudentSearchQuery] = useState(searchParams.get("q") ?? "");
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentStatusFilter>(
    (["active", "inactive", "unassigned"].includes(searchParams.get("status") ?? "")
      ? searchParams.get("status")
      : "all") as StudentStatusFilter,
  );
  const [selectedSectionFilterId, setSelectedSectionFilterId] = useState<string>("all");
  const [transferringEnrollment, setTransferringEnrollment] = useState<StudentEnrollmentDto | null>(
    null,
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [directoryAvailable, setDirectoryAvailable] = useState(initialDirectoryAvailable);
  const [enrollmentsAvailable, setEnrollmentsAvailable] = useState(initialEnrollmentsAvailable);
  const [confirmation, setConfirmation] = useState<
    | { kind: "student"; id: string; name: string; active: boolean }
    | { kind: "withdraw"; id: string; name: string }
    | null
  >(null);

  useEffect(() => {
    if (window.location.pathname !== "/students") return;
    const query = new URLSearchParams(window.location.search);
    if (studentSearchQuery) query.set("q", studentSearchQuery);
    else query.delete("q");
    if (studentStatusFilter !== "all") query.set("status", studentStatusFilter);
    else query.delete("status");
    window.history.replaceState(null, "", "/students" + (query.size ? "?" + query.toString() : ""));
  }, [studentSearchQuery, studentStatusFilter]);

  const availableSections = useMemo(() => {
    return enrollmentsOverview.sectionCapacities.filter(
      (section) => !section.isAcademicYearClosed && section.availableSeats > 0,
    );
  }, [enrollmentsOverview.sectionCapacities]);

  const studentForm = useForm<CreateStudentFormValues>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      studentCode: "",
      firstName: "",
      lastName: "",
      birthDate: "",
      sigerdExternalId: "",
    },
  });

  const guardianForm = useForm<CreateGuardianFormValues>({
    resolver: zodResolver(createGuardianSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
    },
  });

  const linkGuardianForm = useForm<LinkStudentGuardianFormValues>({
    resolver: zodResolver(linkStudentGuardianSchema),
    defaultValues: {
      guardianId: "",
      relationshipType: "Madre",
      hasAcademicAccess: true,
      hasFinancialResponsibility: false,
      hasPickupAuthorization: true,
    },
  });

  const enrollForm = useForm<EnrollStudentFormValues>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: {
      studentId: initialDirectory.students[0]?.id ?? "",
      sectionId: initialEnrollments.sectionCapacities[0]?.sectionId ?? "",
    },
  });

  const transferForm = useForm<TransferStudentSectionFormValues>({
    resolver: zodResolver(transferStudentSectionSchema),
    defaultValues: {
      targetSectionId: "",
    },
  });

  const refreshAll = useCallback(async () => {
    const [dirRes, enrRes] = await Promise.all([
      canReadStudents ? fetchStudentDirectoryOverview() : Promise.resolve(null),
      canReadEnrollments ? fetchEnrollmentsOverview() : Promise.resolve(null),
    ]);
    setProblem(null);
    if (dirRes?.ok) {
      setDirectory(dirRes.data);
      setDirectoryAvailable(true);
    } else if (dirRes) {
      setProblem(dirRes.problem);
      setDirectoryAvailable(false);
    }
    if (enrRes?.ok) {
      setEnrollmentsOverview(enrRes.data);
      setEnrollmentsAvailable(true);
    } else if (enrRes) {
      setProblem(enrRes.problem);
      setEnrollmentsAvailable(false);
    }
  }, [canReadStudents, canReadEnrollments]);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      if (canReadStudents || canReadEnrollments) await refreshAll();
      router.refresh();
    });
  }, [canReadStudents, canReadEnrollments, refreshAll, router]);

  const filteredStudents = useMemo(
    () => filterStudents(directory.students, studentSearchQuery, studentStatusFilter),
    [directory.students, studentSearchQuery, studentStatusFilter],
  );

  const selectedStudent = useMemo(() => {
    if (selectedStudentId) {
      const match = directory.students.find((s) => s.id === selectedStudentId);
      if (match) {
        return match;
      }
    }
    return studentId ? null : (filteredStudents[0] ?? directory.students[0] ?? null);
  }, [directory.students, filteredStudents, selectedStudentId, studentId]);

  const filteredEnrollments = useMemo(() => {
    if (selectedSectionFilterId === "all") {
      return enrollmentsOverview.enrollments;
    }
    return enrollmentsOverview.enrollments.filter(
      (item) => item.sectionId === selectedSectionFilterId,
    );
  }, [enrollmentsOverview.enrollments, selectedSectionFilterId]);

  const toggleDrawer = useCallback(
    (drawer: Exclude<StudentsDrawerKind, null>) => {
      setFeedback(null);
      setOpenDrawer((current) => {
        const next = current === drawer ? null : drawer;
        if (next === "enroll" && selectedStudent) {
          enrollForm.setValue("studentId", selectedStudent.id);
          if (!enrollForm.getValues("sectionId") && availableSections[0]?.sectionId) {
            enrollForm.setValue("sectionId", availableSections[0].sectionId);
          }
        }
        return next;
      });
    },
    [availableSections, enrollForm, selectedStudent],
  );

  const openQuickEnrollForStudent = useCallback(
    (studentId: string) => {
      setFeedback(null);
      setSelectedStudentId(studentId);
      enrollForm.setValue("studentId", studentId);
      if (availableSections[0]?.sectionId) {
        enrollForm.setValue("sectionId", availableSections[0].sectionId);
      }
      setOpenDrawer("enroll");
    },
    [availableSections, enrollForm],
  );

  const openTransferForEnrollment = useCallback(
    (enrollment: StudentEnrollmentDto) => {
      setFeedback(null);
      setTransferringEnrollment(enrollment);
      const candidateSection = availableSections.find(
        (section) =>
          section.academicYearId === enrollment.academicYearId &&
          section.sectionId !== enrollment.sectionId,
      );
      transferForm.setValue("targetSectionId", candidateSection?.sectionId ?? "");
      setOpenDrawer("transfer");
    },
    [availableSections, transferForm],
  );

  const submitCreateStudent = studentForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createStudent(
        {
          studentCode: values.studentCode,
          firstName: values.firstName,
          lastName: values.lastName,
          birthDate: values.birthDate,
          sigerdExternalId: values.sigerdExternalId || null,
        },
        csrfToken,
      );

      if (result.ok) {
        setConfirmation(null);
        setFeedback({
          tone: "success",
          title: `Expediente ${result.data.studentCode} creado`,
          detail: `${result.data.fullName} quedó registrado en el padrón permanente del colegio.`,
          studentId: result.data.id,
        });
        setSelectedStudentId(result.data.id);
        setOpenDrawer(null);
        studentForm.reset({
          studentCode: "",
          firstName: "",
          lastName: "",
          birthDate: values.birthDate,
          sigerdExternalId: "",
        });
        await refreshAll();
        if (window.location.pathname.endsWith("/new"))
          router.replace("/students?created=" + result.data.id);
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          status: result.problem.status,
          detail: result.problem.detail,
        });
      }
    });
  });

  const handleToggleStudentActive = useCallback(
    (studentId: string, studentCode: string, currentlyActive: boolean) => {
      setFeedback(null);
      setActionLoadingId(studentId);
      startTransition(async () => {
        const result = currentlyActive
          ? await deactivateStudent(studentId, csrfToken)
          : await activateStudent(studentId, csrfToken);
        setActionLoadingId(null);

        if (result.ok) {
          setConfirmation(null);
          setFeedback({
            tone: "success",
            title: currentlyActive
              ? `Expediente ${studentCode} desactivado`
              : `Expediente ${studentCode} reactivado`,
            detail: currentlyActive
              ? "El estudiante no podrá recibir nuevas matrículas mientras permanezca inactivo."
              : "El expediente estudiantil volvió a estar habilitado para matriculación.",
          });
          await refreshAll();
        } else {
          setFeedback({
            tone: "error",
            title: result.problem.title,
            status: result.problem.status,
            detail: result.problem.detail,
          });
        }
      });
    },
    [csrfToken, refreshAll],
  );

  const submitCreateGuardian = guardianForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await createGuardian(
        {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber || null,
        },
        csrfToken,
      );

      if (result.ok) {
        setConfirmation(null);
        setFeedback({
          tone: "success",
          title: "Responsable familiar registrado",
          detail: `${result.data.fullName} (${result.data.email}) ya puede vincularse a expedientes estudiantiles.`,
        });
        linkGuardianForm.setValue("guardianId", result.data.id);
        setOpenDrawer(null);
        guardianForm.reset({ fullName: "", email: "", phoneNumber: "" });
        await refreshAll();
        router.push("/guardians");
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          status: result.problem.status,
          detail: result.problem.detail,
        });
      }
    });
  });

  const submitLinkGuardian = linkGuardianForm.handleSubmit((values) => {
    if (!selectedStudent) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await linkStudentGuardian(selectedStudent.id, values, csrfToken);
      if (result.ok) {
        setConfirmation(null);
        setFeedback({
          tone: "success",
          title: "Vínculo familiar establecido",
          detail: `${result.data.fullName} (${result.data.relationshipType}) quedó vinculado a ${selectedStudent.fullName}.`,
        });
        setOpenDrawer(null);
        await refreshAll();
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          status: result.problem.status,
          detail: result.problem.detail,
        });
      }
    });
  });

  const submitEnrollStudent = enrollForm.handleSubmit((values) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await enrollStudent(values, csrfToken);
      if (result.ok) {
        setConfirmation(null);
        setFeedback({
          tone: "success",
          title: `Matrícula confirmada en ${result.data.gradeLevelCode}-${result.data.sectionCode}`,
          detail: `${result.data.studentFullName} (${result.data.studentCode}) ocupa un cupo activo en el año escolar ${result.data.academicYearCode}.`,
        });
        setOpenDrawer(null);
        await refreshAll();
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          status: result.problem.status,
          detail: result.problem.detail,
        });
      }
    });
  });

  const submitTransferSection = transferForm.handleSubmit((values) => {
    if (!transferringEnrollment) {
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await transferStudentSection(transferringEnrollment.id, values, csrfToken);
      if (result.ok) {
        setConfirmation(null);
        setFeedback({
          tone: "success",
          title: "Traslado de sección completado",
          detail: `${result.data.studentFullName} fue reubicado en la sección ${result.data.gradeLevelCode}-${result.data.sectionCode}.`,
        });
        setTransferringEnrollment(null);
        setOpenDrawer(null);
        await refreshAll();
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
          status: result.problem.status,
          detail: result.problem.detail,
        });
      }
    });
  });

  const handleWithdrawEnrollment = useCallback(
    (enrollmentId: string, studentFullName: string) => {
      setFeedback(null);
      setActionLoadingId(enrollmentId);
      startTransition(async () => {
        const result = await withdrawEnrollment(enrollmentId, csrfToken);
        setActionLoadingId(null);

        if (result.ok) {
          setConfirmation(null);
          setFeedback({
            tone: "success",
            title: "Matrícula retirada",
            detail: `Se liberó el cupo de aula correspondiente a ${studentFullName}.`,
          });
          await refreshAll();
        } else {
          setFeedback({
            tone: "error",
            title: result.problem.title,
            status: result.problem.status,
            detail: result.problem.detail,
          });
        }
      });
    },
    [csrfToken, refreshAll],
  );

  const metrics = useMemo(() => {
    const activeStudents = directory.students.filter((s) => s.isActive).length;
    const sigerdCount = directory.students.filter((s) => Boolean(s.sigerdExternalId)).length;
    const activeEnrollments = enrollmentsOverview.enrollments.filter(
      (e) => e.status === "Active",
    ).length;
    const totalCapacity = enrollmentsOverview.sectionCapacities.reduce(
      (acc, s) => acc + s.capacity,
      0,
    );
    const totalAvailableSeats = enrollmentsOverview.sectionCapacities.reduce(
      (acc, s) => acc + s.availableSeats,
      0,
    );

    return {
      totalStudents: directory.students.length,
      activeStudents,
      sigerdCount,
      guardiansCount: directory.guardians.length,
      activeEnrollments,
      totalCapacity,
      totalAvailableSeats,
    };
  }, [directory.guardians.length, directory.students, enrollmentsOverview]);

  const confirmationEnrollment =
    confirmation?.kind === "withdraw"
      ? enrollmentsOverview.enrollments.find((item) => item.id === confirmation.id)
      : undefined;
  const confirmationStudent =
    confirmation?.kind === "student"
      ? directory.students.find((item) => item.id === confirmation.id)
      : undefined;
  const confirmationContext = confirmationEnrollment
    ? `${confirmationEnrollment.gradeLevelName} ${confirmationEnrollment.sectionCode} · ${confirmationEnrollment.academicYearCode}`
    : (confirmationStudent?.studentCode ?? null);

  return {
    directoryAvailable,
    enrollmentsAvailable,
    canReadStudents,
    canReadEnrollments,
    confirmation,
    confirmationContext,
    createdStudent: directory.students.find(
      (student) => student.id === (feedback?.studentId ?? searchParams.get("created")),
    ),
    closeConfirmation: () => {
      if (!isPending) setConfirmation(null);
    },
    confirmAction: () => {
      if (!confirmation || isPending) return;
      if (confirmation.kind === "student")
        handleToggleStudentActive(confirmation.id, confirmation.name, confirmation.active);
      else handleWithdrawEnrollment(confirmation.id, confirmation.name);
    },
    closeCreatePanel: () => {
      if (isPending) return;
      setOpenDrawer(null);
      if (window.location.pathname.endsWith("/new"))
        router.replace(
          window.location.pathname.startsWith("/guardians") ? "/guardians" : "/students",
        );
    },
    directory,
    enrollmentsOverview,
    availableSections,
    problem,
    feedback,
    activeView,
    setActiveView,
    openDrawer,
    setOpenDrawer,
    toggleDrawer,
    selectedStudent,
    selectedStudentId,
    setSelectedStudentId,
    studentSearchQuery,
    setStudentSearchQuery,
    studentStatusFilter,
    setStudentStatusFilter,
    filteredStudents,
    selectedSectionFilterId,
    setSelectedSectionFilterId,
    filteredEnrollments,
    transferringEnrollment,
    setTransferringEnrollment,
    openQuickEnrollForStudent,
    openTransferForEnrollment,
    metrics,
    isPending,
    actionLoadingId,
    handleRefresh,
    handleToggleStudentActive: (id: string, name: string, active: boolean) =>
      setConfirmation({ kind: "student", id, name, active }),
    handleWithdrawEnrollment: (id: string, name: string) =>
      setConfirmation({ kind: "withdraw", id, name }),
    studentForm,
    submitCreateStudent,
    guardianForm,
    submitCreateGuardian,
    linkGuardianForm,
    submitLinkGuardian,
    enrollForm,
    submitEnrollStudent,
    transferForm,
    submitTransferSection,
  };
}

export type ReturnTypeOfStudents = ReturnType<typeof useStudentsWorkspace>;
