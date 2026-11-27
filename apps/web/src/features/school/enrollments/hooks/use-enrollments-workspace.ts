"use client";
import { useId, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { enrollStudent } from "@/features/school/students/api/students-api";
import {
  enrollStudentSchema,
  type EnrollStudentFormValues,
} from "@/features/school/students/schemas/students-schemas";
import { paginateRecords } from "@/features/school/students/schemas/student-directory";
import type { ProblemDetails } from "@/lib/api/types";
import type { EnrollmentsWorkspaceData } from "../schemas/enrollment-types";
import {
  deriveEnrollmentYears,
  selectEnrollmentSections,
  selectEligibleEnrollmentStudents,
  selectAvailableEnrollmentSections,
  selectSectionEnrollments,
  enrollmentStudentLabel,
} from "../schemas/enrollment-selectors";

export function useEnrollmentsWorkspace(data: EnrollmentsWorkspaceData) {
  const router = useRouter();
  const search = useSearchParams();
  const id = useId();
  const [refreshing, startRefresh] = useTransition();
  const years = deriveEnrollmentYears(data.years, data.overview?.sectionCapacities ?? []);
  const [yearId, setYearId] = useState(
    () =>
      years.find((year) => year.id === search.get("year"))?.id ??
      years.find((year) => !year.isClosed)?.id ??
      years[0]?.id ??
      "",
  );
  const sections = selectEnrollmentSections(data.overview?.sectionCapacities ?? [], yearId);
  const [sectionId, setSectionId] = useState(search.get("section") ?? "");
  const selectedSection =
    sections.find((section) => section.sectionId === sectionId) ?? sections[0];
  const selectedYear = years.find((year) => year.id === yearId);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [formProblem, setFormProblem] = useState<ProblemDetails | null>(null);
  const availableSections = selectAvailableEnrollmentSections(
    data.overview?.sectionCapacities ?? [],
    yearId,
  );
  const eligibleStudents = selectEligibleEnrollmentStudents(
    data.students ?? [],
    data.overview?.enrollments ?? [],
    yearId,
  );
  const canEnroll =
    data.canManageEnrollments &&
    data.canReadStudents &&
    data.students !== null &&
    data.overview !== null &&
    !!selectedYear &&
    !selectedYear.isClosed;
  const rows = selectSectionEnrollments(
    data.overview?.enrollments ?? [],
    selectedSection?.sectionId ?? "",
    query,
  );
  const pagination = paginateRecords(rows, page);
  const form = useForm<EnrollStudentFormValues>({
    resolver: zodResolver(enrollStudentSchema),
    defaultValues: { studentId: "", sectionId: "" },
  });
  const busy = form.formState.isSubmitting || refreshing;

  function selection(year: string, section: string) {
    const params = new URLSearchParams(window.location.search);
    if (year) params.set("year", year);
    else params.delete("year");
    if (section) params.set("section", section);
    else params.delete("section");
    window.history.replaceState(null, "", "/enrollments" + (params.size ? "?" + params : ""));
  }
  function changeYear(value: string) {
    setYearId(value);
    setSectionId("");
    setPage(1);
    setQuery("");
    selection(value, "");
  }
  function changeSection(value: string) {
    setSectionId(value);
    setPage(1);
    setQuery("");
    selection(yearId, value);
  }
  function refresh() {
    startRefresh(() => router.refresh());
  }
  function openPanel() {
    if (!canEnroll || busy) return;
    const section =
      availableSections.find((item) => item.sectionId === selectedSection?.sectionId) ??
      availableSections[0];
    form.reset({ studentId: "", sectionId: section?.sectionId ?? "" });
    setStudentQuery("");
    setFormProblem(null);
    setPanelOpen(true);
  }
  function closePanel() {
    if (!busy) setPanelOpen(false);
  }
  function changeStudent(value: string) {
    setStudentQuery(value);
    const student = eligibleStudents.find((item) => enrollmentStudentLabel(item) === value);
    form.setValue("studentId", student?.id ?? "", { shouldValidate: form.formState.isSubmitted });
  }
  const submit = form.handleSubmit(
    async (values) => {
      if (!canEnroll) return;
      if (
        !eligibleStudents.some((student) => student.id === values.studentId) ||
        !availableSections.some((section) => section.sectionId === values.sectionId)
      ) {
        setFormProblem({
          title: "Revisa los datos de la matrícula",
          status: 409,
          detail: "Elige un expediente disponible y una sección abierta con cupos.",
        });
        return;
      }
      setFormProblem(null);
      const result = await enrollStudent(values, data.csrfToken);
      if (!result.ok) {
        setFormProblem({ ...result.problem, status: result.status });
        return;
      }
      setPanelOpen(false);
      form.reset();
      toast.success("Matrícula registrada");
      refresh();
    },
    (errors) => {
      if (errors.studentId) document.getElementById(id + "-student")?.focus();
    },
  );
  const formSectionId = useWatch({ control: form.control, name: "sectionId" });
  const formSection = availableSections.find((section) => section.sectionId === formSectionId);
  return {
    id,
    data,
    years,
    yearId,
    selectedYear,
    sections,
    selectedSection,
    availableSeats: sections.reduce((sum, section) => sum + section.availableSeats, 0),
    changeYear,
    changeSection,
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setPage(1);
    },
    pagination,
    setPage,
    panelOpen,
    openPanel,
    closePanel,
    canEnroll,
    availableSections,
    eligibleStudents,
    studentQuery,
    changeStudent,
    form,
    formSection,
    formProblem,
    submit,
    busy,
    refreshing,
    refresh,
  };
}
export type EnrollmentsWorkspaceState = ReturnType<typeof useEnrollmentsWorkspace>;
