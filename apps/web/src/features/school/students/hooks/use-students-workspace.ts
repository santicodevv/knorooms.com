"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

export type StudentStatusFilter = "all" | "active" | "unassigned";

export interface StudentsFeedbackState {
  tone: "success" | "error";
  title: string;
  detail?: string;
}

interface UseStudentsWorkspaceParams {
  initialDirectory: StudentDirectoryOverviewDto;
  initialEnrollments: EnrollmentsOverviewDto;
  initialProblem: ProblemDetails | null;
  csrfToken: string;
}

export function useStudentsWorkspace({
  initialDirectory,
  initialEnrollments,
  initialProblem,
  csrfToken,
}: UseStudentsWorkspaceParams) {
  const [directory, setDirectory] = useState<StudentDirectoryOverviewDto>(initialDirectory);
  const [enrollmentsOverview, setEnrollmentsOverview] =
    useState<EnrollmentsOverviewDto>(initialEnrollments);
  const [problem, setProblem] = useState<ProblemDetails | null>(initialProblem);
  const [feedback, setFeedback] = useState<StudentsFeedbackState | null>(null);
  const [activeView, setActiveView] = useState<StudentsWorkspaceView>("directory");
  const [openDrawer, setOpenDrawer] = useState<StudentsDrawerKind>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    () => initialDirectory.students[0]?.id ?? null,
  );
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState<StudentStatusFilter>("all");
  const [selectedSectionFilterId, setSelectedSectionFilterId] = useState<string>("all");
  const [transferringEnrollment, setTransferringEnrollment] = useState<StudentEnrollmentDto | null>(
    null,
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      birthDate: "2014-05-15",
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
      guardianId: initialDirectory.guardians[0]?.id ?? "",
      relationshipType: "Madre",
      hasAcademicAccess: true,
      hasFinancialResponsibility: true,
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
      fetchStudentDirectoryOverview(),
      fetchEnrollmentsOverview(),
    ]);

    if (dirRes.ok) {
      setDirectory(dirRes.data);
      setProblem(null);
    } else {
      setProblem(dirRes.problem);
    }

    if (enrRes.ok) {
      setEnrollmentsOverview(enrRes.data);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refreshAll();
    });
  }, [refreshAll]);

  const filteredStudents = useMemo(() => {
    const query = studentSearchQuery.trim().toLowerCase();

    return directory.students.filter((student) => {
      if (studentStatusFilter === "active" && !student.isActive) {
        return false;
      }
      if (studentStatusFilter === "unassigned" && student.latestEnrollment?.status === "Active") {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        student.studentCode.toLowerCase().includes(query) ||
        student.fullName.toLowerCase().includes(query) ||
        (student.sigerdExternalId?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [directory.students, studentSearchQuery, studentStatusFilter]);

  const selectedStudent = useMemo(() => {
    if (selectedStudentId) {
      const match = directory.students.find((s) => s.id === selectedStudentId);
      if (match) {
        return match;
      }
    }
    return filteredStudents[0] ?? directory.students[0] ?? null;
  }, [directory.students, filteredStudents, selectedStudentId]);

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
        if (next === "link-guardian" && directory.guardians[0]?.id) {
          if (!linkGuardianForm.getValues("guardianId")) {
            linkGuardianForm.setValue("guardianId", directory.guardians[0].id);
          }
        }
        return next;
      });
    },
    [availableSections, directory.guardians, enrollForm, linkGuardianForm, selectedStudent],
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
        setFeedback({
          tone: "success",
          title: `Expediente ${result.data.studentCode} creado`,
          detail: `${result.data.fullName} quedó registrado en el padrón permanente del colegio.`,
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
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
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
        setFeedback({
          tone: "success",
          title: "Responsable familiar registrado",
          detail: `${result.data.fullName} (${result.data.email}) ya puede vincularse a expedientes estudiantiles.`,
        });
        linkGuardianForm.setValue("guardianId", result.data.id);
        setOpenDrawer(null);
        guardianForm.reset({ fullName: "", email: "", phoneNumber: "" });
        await refreshAll();
      } else {
        setFeedback({
          tone: "error",
          title: result.problem.title,
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

  return {
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
    handleToggleStudentActive,
    handleWithdrawEnrollment,
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
