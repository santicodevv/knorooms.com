import { SchoolSidePanel, type SchoolSidePanelProps } from "../../components/school-side-panel";

export function StudentSidePanel(props: SchoolSidePanelProps) {
  return <SchoolSidePanel {...props} titleId={props.titleId ?? "student-panel-title"} />;
}
