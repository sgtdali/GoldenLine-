import { useCallback } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import type { AppNode, AppEdge } from "../types/flow";
import { v4 as uuidv4 } from "uuid";

type Params = {
  reactFlowInstance: ReactFlowInstance<AppNode, any> | null;
  projectId: string;
  setNodes: React.Dispatch<React.SetStateAction<AppNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<AppEdge[]>>;
  projectName?: string | null;
};

export const useEditorActions = ({
  reactFlowInstance,
  projectId,
  setNodes,
  setEdges,
  projectName,
}: Params) => {
  const onAddNode = useCallback(() => {
    if (!reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: reactFlowInstance.getViewport().x + 250,
      y: reactFlowInstance.getViewport().y + 100,
    });

    const newNode: AppNode = {
      id: uuidv4(),
      type: "custom",
      position,
      data: {
        label: "Yeni GÃ¶rev",
        duration: 1,
        completion: 0,
        department: "Atanmadi",
      },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  const onAddGroupNode = useCallback(() => {
    if (!reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: reactFlowInstance.getViewport().x + 250,
      y: reactFlowInstance.getViewport().y + 100,
    });

    const newNode: AppNode = {
      id: uuidv4(),
      type: "grup",
      position,
      data: { label: "Yeni Grup" },
      style: { width: 400, height: 200 },
    };

    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  const handleExportToMSProject = useCallback(() => {
    if (!reactFlowInstance) {
      console.error("React Flow instance not ready.");
      return;
    }

    const escapeXml = (value: string): string =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const normalizeNumber = (value: unknown): number | null => {
      if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
      }
      if (typeof value === "string") {
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const convertDaysToDuration = (daysLike: unknown): string => {
      const parsed = normalizeNumber(daysLike);
      const validDays = parsed && parsed > 0 ? parsed : 1;
      const hours = Math.round(validDays * 8 * 100) / 100;
      return `PT${hours}H0M0S`;
    };

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const projectDateTime = `${year}-${month}-${day}T08:00:00`;

    const nodes = reactFlowInstance.getNodes();
    const edges = reactFlowInstance.getEdges();

    const defaultProjectName = (projectName ?? "").trim() || "GoldenLine Projesi";
    const xmlProjectName = escapeXml(defaultProjectName);
    const fileSafeProjectName = defaultProjectName.replace(/[\\/:*?"<>|]/g, "_");

    const defaultResources = ["Mekanik", "Elektrik", "AkÃƒâ€Ã‚Â±Ãƒâ€¦Ã…Â¸kan"];
    const resourceSet = new Set<string>(defaultResources);

    nodes.forEach((node) => {
      const dept = (node.data?.department ?? "").toString().trim();
      if (dept.length > 0) {
        resourceSet.add(dept);
      }
    });

    if (resourceSet.size === 0) {
      resourceSet.add("Genel");
    }

    const resources = Array.from(resourceSet);

    const baseCalendarUID = 3;
    const resourceDataMap = new Map<
      string,
      { resourceUID: number; calendarUID: number }
    >();
    const baseResourceUID = 1;

    resources.forEach((name, index) => {
      resourceDataMap.set(name, {
        resourceUID: baseResourceUID + index,
        calendarUID: baseCalendarUID + index,
      });
    });

    const xmlHeader = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
\t<SaveVersion>14</SaveVersion>
\t<Name>${xmlProjectName}.xml</Name>
\t<Title>${xmlProjectName}</Title>
\t<CreationDate>${projectDateTime}</CreationDate>
\t<ScheduleFromStart>1</ScheduleFromStart>
\t<StartDate>${projectDateTime}</StartDate>
\t<FinishDate>${projectDateTime}</FinishDate>
\t<CriticalSlackLimit>0</CriticalSlackLimit>
\t<CalendarUID>1</CalendarUID>
\t<DefaultStartTime>08:00:00</DefaultStartTime>
\t<DefaultFinishTime>17:00:00</DefaultFinishTime>
\t<MinutesPerDay>480</MinutesPerDay>
\t<MinutesPerWeek>2400</MinutesPerWeek>
\t<DaysPerMonth>20</DaysPerMonth>
\t<DefaultTaskType>0</DefaultTaskType>
\t<DefaultFixedCostAccrual>3</DefaultFixedCostAccrual>
\t<DefaultStandardRate>0</DefaultStandardRate>
\t<DefaultOvertimeRate>0</DefaultOvertimeRate>
\t<DurationFormat>7</DurationFormat>
\t<WorkFormat>2</WorkFormat>
\t<HonorConstraints>0</HonorConstraints>
\t<InsertedProjectsLikeSummary>1</InsertedProjectsLikeSummary>
\t<MultipleCriticalPaths>0</MultipleCriticalPaths>
\t<NewTasksEffortDriven>0</NewTasksEffortDriven>
\t<NewTasksEstimated>1</NewTasksEstimated>
\t<SplitsInProgressTasks>1</SplitsInProgressTasks>
\t<SpreadActualCost>0</SpreadActualCost>
\t<SpreadPercentComplete>0</SpreadPercentComplete>
\t<TaskUpdatesResource>1</TaskUpdatesResource>
\t<FiscalYearStart>0</FiscalYearStart>
\t<WeekStartDay>1</WeekStartDay>
\t<MoveCompletedEndsBack>0</MoveCompletedEndsBack>
\t<MoveRemainingStartsBack>0</MoveRemainingStartsBack>
\t<MoveRemainingStartsForward>0</MoveRemainingStartsForward>
\t<MoveCompletedEndsForward>0</MoveCompletedEndsForward>
\t<BaselineForEarnedValue>0</BaselineForEarnedValue>
\t<AutoAddNewResourcesAndTasks>1</AutoAddNewResourcesAndTasks>
\t<CurrentDate>${projectDateTime}</CurrentDate>
\t<MicrosoftProjectServerURL>1</MicrosoftProjectServerURL>
\t<Autolink>0</Autolink>
\t<NewTaskStartDate>0</NewTaskStartDate>
\t<NewTasksAreManual>1</NewTasksAreManual>
\t<DefaultTaskEVMethod>0</DefaultTaskEVMethod>
\t<ProjectExternallyEdited>0</ProjectExternallyEdited>
\t<ExtendedCreationDate>1984-01-01T00:00:00</ExtendedCreationDate>
\t<ActualsInSync>0</ActualsInSync>
\t<RemoveFileProperties>0</RemoveFileProperties>
\t<AdminProject>0</AdminProject>
\t<UpdateManuallyScheduledTasksWhenEditingLinks>1</UpdateManuallyScheduledTasksWhenEditingLinks>
\t<KeepTaskOnNearestWorkingTimeWhenMadeAutoScheduled>0</KeepTaskOnNearestWorkingTimeWhenMadeAutoScheduled>
\t<OutlineCodes/>
\t<WBSMasks/>
\t<ExtendedAttributes/>
`;

    let resourceCalendarsXml = "";
    resources.forEach((resourceName, index) => {
      const calendarUID = baseCalendarUID + index;
      resourceCalendarsXml += `
\t\t<Calendar>
\t\t\t<UID>${calendarUID}</UID>
\t\t\t<Name>${escapeXml(resourceName)}</Name>
\t\t\t<IsBaseCalendar>0</IsBaseCalendar>
\t\t\t<IsBaselineCalendar>0</IsBaselineCalendar>
\t\t\t<BaseCalendarUID>1</BaseCalendarUID>
\t\t</Calendar>`;
    });

    let xmlString = xmlHeader;
    xmlString += `
\t<Calendars>
${resourceCalendarsXml}
\t</Calendars>
`;

    let resourcesXml = `\n\t<Resources>\n`;
    resources.forEach((resourceName) => {
      const mapping = resourceDataMap.get(resourceName);
      if (!mapping) {
        return;
      }
      const initials = resourceName.substring(0, 1).toLowerCase();
      resourcesXml += `
\t\t<Resource>
\t\t\t<UID>${mapping.resourceUID}</UID>
\t\t\t<ID>${mapping.resourceUID}</ID>
\t\t\t<Name>${escapeXml(resourceName)}</Name>
\t\t\t<Type>1</Type>
\t\t\t<IsNull>0</IsNull>
\t\t\t<Initials>${escapeXml(initials)}</Initials>
\t\t\t<WorkGroup>0</WorkGroup>
\t\t\t<MaxUnits>1.00</MaxUnits>
\t\t\t<PeakUnits>1.00</PeakUnits>
\t\t\t<OverAllocated>0</OverAllocated>
\t\t\t<CanLevel>1</CanLevel>
\t\t\t<AccrueAt>3</AccrueAt>
\t\t\t<OvertimeWork>PT0H0M0S</OvertimeWork>
\t\t\t<ActualWork>PT0H0M0S</ActualWork>
\t\t\t<ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>
\t\t\t<RemainingOvertimeWork>PT0H0M0S</RemainingOvertimeWork>
\t\t\t<PercentWorkComplete>0</PercentWorkComplete>
\t\t\t<StandardRate>0</StandardRate>
\t\t\t<StandardRateFormat>4</StandardRateFormat>
\t\t\t<Cost>0</Cost>
\t\t\t<OvertimeRate>0</OvertimeRate>
\t\t\t<OvertimeRateFormat>4</OvertimeRateFormat>
\t\t\t<OvertimeCost>0</OvertimeCost>
\t\t\t<CostPerUse>0</CostPerUse>
\t\t\t<ActualCost>0</ActualCost>
\t\t\t<ActualOvertimeCost>0</ActualOvertimeCost>
\t\t\t<RemainingCost>0</RemainingCost>
\t\t\t<RemainingOvertimeCost>0</RemainingOvertimeCost>
\t\t\t<WorkVariance>0.00</WorkVariance>
\t\t\t<CostVariance>0</CostVariance>
\t\t\t<SV>0.00</SV>
\t\t\t<CV>0.00</CV>
\t\t\t<ACWP>0.00</ACWP>
\t\t\t<CalendarUID>${mapping.calendarUID}</CalendarUID>
\t\t\t<BCWS>0.00</BCWS>
\t\t\t<BCWP>0.00</BCWP>
\t\t\t<IsGeneric>0</IsGeneric>
\t\t\t<IsInactive>0</IsInactive>
\t\t\t<IsEnterprise>0</IsEnterprise>
\t\t\t<BookingType>0</BookingType>
\t\t\t<CreationDate>${projectDateTime}</CreationDate>
\t\t\t<IsCostResource>0</IsCostResource>
\t\t\t<IsBudget>0</IsBudget>
\t\t</Resource>`;
    });
    resourcesXml += `\t</Resources>\n`;
    xmlString += resourcesXml;

    type TreeNode = {
      node: AppNode;
      children: TreeNode[];
    };

    const nodeIdToTreeNode = new Map<string, TreeNode>();
    nodes.forEach((node) => {
      nodeIdToTreeNode.set(node.id, { node, children: [] });
    });

    const getParentId = (node: AppNode): string | null => {
      const rawParent =
        (node as any).parentId ??
        (node as any).parentNode ??
        node.data?.parentNodeId ??
        null;
      if (rawParent === undefined || rawParent === null) {
        return null;
      }
      const value = String(rawParent).trim();
      return value.length === 0 ? null : value;
    };

    const rootTreeNodes: TreeNode[] = [];
    nodes.forEach((node) => {
      const treeNode = nodeIdToTreeNode.get(node.id);
      if (!treeNode) {
        return;
      }
      const parentId = getParentId(node);
      if (parentId && nodeIdToTreeNode.has(parentId)) {
        nodeIdToTreeNode.get(parentId)!.children.push(treeNode);
      } else {
        rootTreeNodes.push(treeNode);
      }
    });

    const sortTreeNodes = (list: TreeNode[]): TreeNode[] => {
      list.sort((a, b) => {
        const ay = a.node.position?.y ?? 0;
        const by = b.node.position?.y ?? 0;
        if (ay !== by) {
          return ay - by;
        }
        const ax = a.node.position?.x ?? 0;
        const bx = b.node.position?.x ?? 0;
        return ax - bx;
      });
      list.forEach((child) => sortTreeNodes(child.children));
      return list;
    };
    sortTreeNodes(rootTreeNodes);

    const durationById = new Map<string, number>();
    const isGroupNode = (node: AppNode) => (node.type ?? "custom") === "grup";

    const getNodeDurationDays = (node: AppNode): number => {
      const raw = normalizeNumber(node.data?.duration);
      return raw && raw > 0 ? raw : 1;
    };

    const computeDurations = (treeNode: TreeNode): number => {
      if (isGroupNode(treeNode.node)) {
        let total = 0;
        treeNode.children.forEach((child) => {
          total += computeDurations(child);
        });
        if (total <= 0) {
          total = 1;
        }
        durationById.set(treeNode.node.id, total);
        return total;
      }
      const own = getNodeDurationDays(treeNode.node);
      durationById.set(treeNode.node.id, own);
      treeNode.children.forEach((child) => {
        computeDurations(child);
      });
      return own;
    };
    rootTreeNodes.forEach((root) => computeDurations(root));

    type ExportEntry = {
      treeNode: TreeNode;
      outlineNumber: string;
      outlineLevel: number;
      isSummary: boolean;
    };

    const exportEntries: ExportEntry[] = [];
    const traverseTree = (
      nodesList: TreeNode[],
      parentOutline: string | null
    ) => {
      nodesList.forEach((treeNode, index) => {
        const segment = index + 1;
        const outlineNumber = parentOutline
          ? `${parentOutline}.${segment}`
          : `${segment}`;
        const outlineLevel = outlineNumber.split(".").length;
        const isSummary = isGroupNode(treeNode.node);
        exportEntries.push({ treeNode, outlineNumber, outlineLevel, isSummary });
        traverseTree(treeNode.children, outlineNumber);
      });
    };
    traverseTree(rootTreeNodes, null);

    const baseTaskUID = 101;
    const nodeUidMap = new Map<string, number>();
    exportEntries.forEach((entry, index) => {
      nodeUidMap.set(entry.treeNode.node.id, baseTaskUID + index);
    });

    let tasksXml = "\t<Tasks>\n";
    exportEntries.forEach((entry, index) => {
      const { treeNode, outlineNumber, outlineLevel, isSummary } = entry;
      const node = treeNode.node;
      const taskUID = nodeUidMap.get(node.id) ?? baseTaskUID + index;
      const taskID = index + 1;
      const taskName =
        (node.data?.label && node.data.label.trim().length > 0
          ? node.data.label
          : "Isimsiz Gorev") ?? "Isimsiz Gorev";
      const durationDays = durationById.get(node.id) ?? 1;
      const durationString = convertDaysToDuration(durationDays);
      const workString = isSummary ? "PT0H0M0S" : durationString;

      let predecessorsXml = "";
      if (!isSummary) {
        const incomingEdges = edges.filter((edge) => edge.target === node.id);
        incomingEdges.forEach((edge) => {
          const predecessorNodeUID = nodeUidMap.get(edge.source);
          if (predecessorNodeUID) {
            predecessorsXml += `
\t\t\t<PredecessorLink>
\t\t\t\t<PredecessorUID>${predecessorNodeUID}</PredecessorUID>
\t\t\t\t<Type>1</Type>
\t\t\t\t<CrossProject>0</CrossProject>
\t\t\t\t<LinkLag>0</LinkLag>
\t\t\t\t<LagFormat>7</LagFormat>
\t\t\t</PredecessorLink>`;
          }
        });
      }

      tasksXml += `
\t\t<Task>
\t\t\t<UID>${taskUID}</UID>
\t\t\t<ID>${taskID}</ID>
\t\t\t<Name>${escapeXml(taskName)}</Name>
\t\t\t<Active>1</Active>
\t\t\t<Manual>0</Manual>
\t\t\t<Type>${isSummary ? 1 : 0}</Type>
\t\t\t<IsNull>0</IsNull>
\t\t\t<CreateDate>${projectDateTime}</CreateDate>
\t\t\t<WBS>${outlineNumber}</WBS>
\t\t\t<OutlineNumber>${outlineNumber}</OutlineNumber>
\t\t\t<OutlineLevel>${outlineLevel}</OutlineLevel>
\t\t\t<Priority>500</Priority>
\t\t\t<Start>${projectDateTime}</Start>
\t\t\t<Finish>${projectDateTime}</Finish>
\t\t\t<Duration>${durationString}</Duration>
\t\t\t<DurationFormat>${isSummary ? 21 : 7}</DurationFormat>
\t\t\t<Work>${workString}</Work>
\t\t\t<ResumeValid>0</ResumeValid>
\t\t\t<EffortDriven>0</EffortDriven>
\t\t\t<Recurring>0</Recurring>
\t\t\t<OverAllocated>0</OverAllocated>
\t\t\t<Estimated>0</Estimated>
\t\t\t<Milestone>0</Milestone>
\t\t\t<Summary>${isSummary ? 1 : 0}</Summary>
\t\t\t<DisplayAsSummary>0</DisplayAsSummary>
\t\t\t<Critical>1</Critical>
\t\t\t<IsSubproject>0</IsSubproject>
\t\t\t<IsSubprojectReadOnly>0</IsSubprojectReadOnly>
\t\t\t<ExternalTask>0</ExternalTask>
\t\t\t<FreeSlack>0</FreeSlack>
\t\t\t<TotalSlack>0</TotalSlack>
\t\t\t<StartSlack>0</StartSlack>
\t\t\t<FinishSlack>0</FinishSlack>
\t\t\t<FixedCost>0</FixedCost>
\t\t\t<FixedCostAccrual>3</FixedCostAccrual>
\t\t\t<PercentComplete>0</PercentComplete>
\t\t\t<PercentWorkComplete>0</PercentWorkComplete>
\t\t\t<ActualDuration>PT0H0M0S</ActualDuration>
\t\t\t<ActualCost>0</ActualCost>
\t\t\t<ActualOvertimeCost>0</ActualOvertimeCost>
\t\t\t<ActualWork>PT0H0M0S</ActualWork>
\t\t\t<ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>
\t\t\t<RegularWork>${isSummary ? "PT0H0M0S" : durationString}</RegularWork>
\t\t\t<RemainingDuration>${durationString}</RemainingDuration>
\t\t\t<RemainingCost>0</RemainingCost>
\t\t\t<RemainingWork>${workString}</RemainingWork>
\t\t\t<RemainingOvertimeCost>0</RemainingOvertimeCost>
\t\t\t<RemainingOvertimeWork>PT0H0M0S</RemainingOvertimeWork>
\t\t\t<ACWP>0.00</ACWP>
\t\t\t<CV>0.00</CV>
\t\t\t<ConstraintType>0</ConstraintType>
\t\t\t<CalendarUID>-1</CalendarUID>
\t\t\t<LevelAssignments>1</LevelAssignments>
\t\t\t<LevelingCanSplit>1</LevelingCanSplit>
\t\t\t<LevelingDelay>0</LevelingDelay>
\t\t\t<LevelingDelayFormat>8</LevelingDelayFormat>
\t\t\t<IgnoreResourceCalendar>0</IgnoreResourceCalendar>
\t\t\t<HideBar>0</HideBar>
\t\t\t<Rollup>${isSummary ? 1 : 0}</Rollup>
\t\t\t<BCWS>0.00</BCWS>
\t\t\t<BCWP>0.00</BCWP>
\t\t\t<PhysicalPercentComplete>0</PhysicalPercentComplete>
\t\t\t<EarnedValueMethod>0</EarnedValueMethod>
${predecessorsXml}
\t\t\t<IsPublished>${isSummary ? 0 : 1}</IsPublished>
\t\t\t<CommitmentType>0</CommitmentType>
\t\t</Task>`;
    });
    tasksXml += "\t</Tasks>\n";
    xmlString += tasksXml;

    let assignmentsXml = `\n\t<Assignments>\n`;
    let assignmentUIDCounter = 5001;
    exportEntries.forEach((entry) => {
      if (entry.isSummary) {
        return;
      }
      const node = entry.treeNode.node;
      const department = (node.data?.department ?? "").toString().trim();
      const mapping = department ? resourceDataMap.get(department) : undefined;
      if (!mapping) {
        return;
      }
      const taskUID = nodeUidMap.get(node.id);
      if (!taskUID) {
        return;
      }
      const durationDays = durationById.get(node.id) ?? 1;
      const durationString = convertDaysToDuration(durationDays);
      const currentAssignmentUID = assignmentUIDCounter++;

      assignmentsXml += `
\t\t<Assignment>
\t\t\t<UID>${currentAssignmentUID}</UID>
\t\t\t<TaskUID>${taskUID}</TaskUID>
\t\t\t<ResourceUID>${mapping.resourceUID}</ResourceUID>
\t\t\t<PercentWorkComplete>0</PercentWorkComplete>
\t\t\t<ActualCost>0</ActualCost>
\t\t\t<ActualOvertimeCost>0</ActualOvertimeCost>
\t\t\t<ActualOvertimeWork>PT0H0M0S</ActualOvertimeWork>
\t\t\t<ActualWork>PT0H0M0S</ActualWork>
\t\t\t<ACWP>0.00</ACWP>
\t\t\t<Confirmed>0</Confirmed>
\t\t\t<Cost>0</Cost>
\t\t\t<CostRateTable>0</CostRateTable>
\t\t\t<RateScale>0</RateScale>
\t\t\t<CostVariance>0</CostVariance>
\t\t\t<CV>0.00</CV>
\t\t\t<Delay>0</Delay>
\t\t\t<Finish>${projectDateTime}</Finish>
\t\t\t<FinishVariance>0</FinishVariance>
\t\t\t<WorkVariance>0.00</WorkVariance>
\t\t\t<HasFixedRateUnits>1</HasFixedRateUnits>
\t\t\t<FixedMaterial>0</FixedMaterial>
\t\t\t<LevelingDelay>0</LevelingDelay>
\t\t\t<LevelingDelayFormat>7</LevelingDelayFormat>
\t\t\t<LinkedFields>0</LinkedFields>
\t\t\t<Milestone>0</Milestone>
\t\t\t<Overallocated>0</Overallocated>
\t\t\t<OvertimeCost>0</OvertimeCost>
\t\t\t<OvertimeWork>PT0H0M0S</OvertimeWork>
\t\t\t<RegularWork>${durationString}</RegularWork>
\t\t\t<RemainingCost>0</RemainingCost>
\t\t\t<RemainingOvertimeCost>0</RemainingOvertimeCost>
\t\t\t<RemainingOvertimeWork>PT0H0M0S</RemainingOvertimeWork>
\t\t\t<RemainingWork>${durationString}</RemainingWork>
\t\t\t<ResponsePending>0</ResponsePending>
\t\t\t<Start>${projectDateTime}</Start>
\t\t\t<StartVariance>0</StartVariance>
\t\t\t<Units>1</Units>
\t\t\t<UpdateNeeded>0</UpdateNeeded>
\t\t\t<VAC>0.00</VAC>
\t\t\t<Work>${durationString}</Work>
\t\t\t<WorkContour>0</WorkContour>
\t\t\t<BCWS>0.00</BCWS>
\t\t\t<BCWP>0.00</BCWP>
\t\t\t<BookingType>0</BookingType>
\t\t\t<CreationDate>${projectDateTime}</CreationDate>
\t\t\t<BudgetCost>0</BudgetCost>
\t\t\t<BudgetWork>PT0H0M0S</BudgetWork>
\t\t</Assignment>`;
    });
    assignmentsXml += "\t</Assignments>\n";
    xmlString += assignmentsXml;
    xmlString += "</Project>";

    const blob = new Blob([xmlString], {
      type: "application/xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const downloadName =
      (fileSafeProjectName || `MontajAkisi-${projectId}`) + ".xml";
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("XML Export initiated.");
  }, [projectId, projectName, reactFlowInstance]);

  const handleImportFromMSProject = useCallback(
    async (file: File) => {
      try {
        const xmlText = await file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlText, "application/xml");
        const parseError = doc.getElementsByTagName("parsererror")[0];
        if (parseError) {
          console.error("XML parse error", parseError.textContent);
          alert("XML dosyasi okunamadi.");
          return;
        }

        const textFromChild = (parent: Element, tag: string) => {
          const el = parent.getElementsByTagName(tag)[0];
          return el?.textContent?.trim() ?? null;
        };

    const parseDurationDays = (value: string | null) => {
      if (!value) return null;
      const match = value.match(/PT([\d.]+)H/i);
          if (match && match[1]) {
            const hours = parseFloat(match[1]);
            if (Number.isFinite(hours)) {
              return Math.round((hours / 8) * 100) / 100;
            }
          }
          const dayMatch = value.match(/P([\d.]+)D/i);
          if (dayMatch && dayMatch[1]) {
            const days = parseFloat(dayMatch[1]);
            if (Number.isFinite(days)) {
              return Math.round(days * 100) / 100;
            }
          }
          return null;
        };

    const taskElements = Array.from(doc.getElementsByTagName("Task"));
    const nodes: AppNode[] = [];
    const uidSet = new Set<string>();
    const predecessorsById = new Map<string, string[]>();
    const indentX = 80;
    const gapY = 32;
    const padding = 32;
    const defaultGroupSize = { width: 360, height: 180 };
    const defaultNodeSize = { width: 220, height: 100 };
    const columnSpacing = 220;

    const levelStack: Array<{ id: string; outlineLevel: number }> = [];

    taskElements.forEach((taskEl, index) => {
      const uid = textFromChild(taskEl, "UID");
      if (!uid || uid === "0") {
        return;
      }
      const name = textFromChild(taskEl, "Name") ?? `Gorev ${uid}`;
      const duration = parseDurationDays(textFromChild(taskEl, "Duration"));
      const completionRaw = textFromChild(taskEl, "PercentComplete");
      const completion = completionRaw ? Number(completionRaw) : undefined;
      const outlineLevelText = textFromChild(taskEl, "OutlineLevel");
      const outlineLevel = outlineLevelText
        ? Math.max(1, parseInt(outlineLevelText, 10) || 1)
        : 1;
      const isSummary = textFromChild(taskEl, "Summary") === "1";

      while (levelStack.length >= outlineLevel) {
        levelStack.pop();
      }
      const parent = levelStack[levelStack.length - 1];
      const parentId = parent ? parent.id : null;

      const node: AppNode = {
        id: uid,
        type: isSummary ? "grup" : "custom",
        position: {
          x: 0,
          y: index * gapY,
        },
        data: {
          label: name,
          duration: duration ?? undefined,
          completion:
            completion !== undefined && Number.isFinite(completion)
              ? completion
              : undefined,
          department: undefined,
          parentNodeId: parentId ?? undefined,
        },
      };

      if (isSummary) {
        node.style = { ...defaultGroupSize };
      }

      nodes.push(node);
      uidSet.add(uid);

      if (isSummary) {
        levelStack.push({ id: uid, outlineLevel });
      }

      const predecessors = Array.from(
        taskEl.getElementsByTagName("PredecessorLink")
      )
        .map((predEl) => textFromChild(predEl, "PredecessorUID"))
        .filter((id): id is string => Boolean(id));
      predecessorsById.set(uid, predecessors);
    });

    type TempNode = {
      node: AppNode;
      parentId: string | null;
      size: { width: number; height: number };
    };

    const tempNodes: TempNode[] = nodes.map((node) => ({
      node,
      parentId:
        (node.data as any)?.parentNodeId !== undefined
          ? ((node.data as any)?.parentNodeId as string | null)
          : null,
      size:
        node.style && node.style.width && node.style.height
          ? { width: Number(node.style.width), height: Number(node.style.height) }
          : node.type === "grup"
            ? { ...defaultGroupSize }
            : { ...defaultNodeSize },
    }));

    const tempMap = new Map<string, TempNode>();
    tempNodes.forEach((temp) => tempMap.set(temp.node.id, temp));

    const childrenByParent = new Map<string, TempNode[]>();
    tempNodes.forEach((temp) => {
      if (!temp.parentId) return;
      const bucket = childrenByParent.get(temp.parentId);
      if (bucket) {
        bucket.push(temp);
      } else {
        childrenByParent.set(temp.parentId, [temp]);
      }
    });

    const ensureSize = (temp: TempNode) => {
      if (!temp.node.style) {
        temp.node.style = {};
      }
      if (!temp.node.style.width) {
        temp.node.style.width = temp.size.width;
      }
      if (!temp.node.style.height) {
        temp.node.style.height = temp.size.height;
      }
    };

    const topoOrder = (() => {
      const inDegree = new Map<string, number>();
      uidSet.forEach((id) => inDegree.set(id, 0));
      predecessorsById.forEach((preds, id) => {
        preds.forEach((p) => {
          if (uidSet.has(p) && uidSet.has(id)) {
            inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
          }
        });
      });

      const queue: string[] = [];
      inDegree.forEach((deg, id) => {
        if (deg === 0) queue.push(id);
      });

      const order: string[] = [];
      const adj = new Map<string, string[]>();
      predecessorsById.forEach((preds, id) => {
        preds.forEach((p) => {
          if (!uidSet.has(p) || !uidSet.has(id)) return;
          const list = adj.get(p);
          if (list) list.push(id);
          else adj.set(p, [id]);
        });
      });

      while (queue.length) {
        const current = queue.shift()!;
        order.push(current);
        (adj.get(current) ?? []).forEach((next) => {
          inDegree.set(next, (inDegree.get(next) ?? 0) - 1);
          if ((inDegree.get(next) ?? 0) === 0) {
            queue.push(next);
          }
        });
      }

      // If cycle, fall back to original order
      if (order.length !== uidSet.size) {
        return nodes.map((n) => n.id);
      }
      return order;
    })();

    const topoIndex = new Map<string, number>();
    topoOrder.forEach((id, idx) => topoIndex.set(id, idx));

    const columnMap = new Map<string, number>();
    topoOrder.forEach((id) => {
      const preds = predecessorsById.get(id) ?? [];
      if (!preds.length) {
        columnMap.set(id, 0);
        return;
      }
      let col = 0;
      preds.forEach((p) => {
        const pc = columnMap.get(p);
        if (pc !== undefined) {
          col = Math.max(col, pc + 1);
        }
      });
      columnMap.set(id, col);
    });

    childrenByParent.forEach((list, parentId) => {
      list.sort((a, b) => {
        const ai = topoIndex.get(a.node.id) ?? 0;
        const bi = topoIndex.get(b.node.id) ?? 0;
        return ai - bi;
      });
    });

    const layoutNode = (
      temp: TempNode,
      level: number,
      startY: number,
      parentColumn: number
    ): { height: number; width: number } => {
      const node = temp.node;
      const children = childrenByParent.get(node.id) ?? [];

      const currentColumn = columnMap.get(node.id) ?? parentColumn;
      const baseX = (currentColumn - parentColumn) * columnSpacing + level * indentX;

      if (children.length === 0) {
        node.position = { x: baseX, y: startY };
        ensureSize(temp);
        return { height: temp.size.height, width: temp.size.width };
      }

      let cursorY = startY + padding;
      let maxChildWidth = 0;

      children.forEach((child) => {
        const childLayout = layoutNode(child, level + 1, cursorY, currentColumn);
        const childColumn = columnMap.get(child.node.id) ?? currentColumn;
        const childX =
          (childColumn - currentColumn) * columnSpacing + (level + 1) * indentX + padding;
        child.node.position = {
          x: childX,
          y: cursorY,
        };
        cursorY += childLayout.height + gapY;
        maxChildWidth = Math.max(
          maxChildWidth,
          childX + childLayout.width - baseX
        );
      });

      const childrenHeight =
        cursorY - startY - gapY + padding;

      const desiredWidth = Math.max(temp.size.width, maxChildWidth + padding);
      const desiredHeight = Math.max(
        temp.size.height,
        childrenHeight + padding
      );

      node.position = { x: baseX, y: startY };
      node.style = {
        ...(node.style ?? {}),
        width: desiredWidth,
        height: desiredHeight,
      };
      temp.size = { width: desiredWidth, height: desiredHeight };

      return { height: desiredHeight, width: desiredWidth };
    };

    const roots = tempNodes.filter((temp) => !temp.parentId);
    let rootCursorY = 0;
    roots.forEach((root) => {
      const layout = layoutNode(root, 0, rootCursorY, 0);
      rootCursorY += layout.height + 2 * gapY;
    });

    const edges: AppEdge[] = [];
        taskElements.forEach((taskEl) => {
          const targetUid = textFromChild(taskEl, "UID");
          if (!targetUid || !uidSet.has(targetUid)) {
            return;
          }
          const predecessors = Array.from(
            taskEl.getElementsByTagName("PredecessorLink")
          );
          predecessors.forEach((predEl, idx) => {
            const sourceUid = textFromChild(predEl, "PredecessorUID");
            if (!sourceUid || !uidSet.has(sourceUid)) {
              return;
            }
            edges.push({
              id: `${sourceUid}->${targetUid}-${idx}`,
              source: sourceUid,
              target: targetUid,
              sourceHandle: "right",
              targetHandle: "left",
              type: "smoothstep",
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#0078d4",
                width: 20,
                height: 20,
              },
            });
          });
        });

        setNodes(nodes);
        setEdges(edges);
      } catch (error) {
        console.error("Failed to import MS Project XML on client:", error);
        alert("MS Project dosyasi ice aktarilamadi.");
      }
    },
    [setEdges, setNodes]
  );

  return {
    onAddNode,
    onAddGroupNode,
    handleExportToMSProject,
    handleImportFromMSProject,
  } as const;
};

