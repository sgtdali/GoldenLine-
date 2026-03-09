import React, { memo } from 'react';
import { Handle, NodeResizer, Position } from '@xyflow/react';
import './GrupNode.css';
type GrupNodeProps = {
  data: { label?: string; groupDurationDays?: number };
  selected?: boolean;
  isConnectable?: boolean;
  hideDuration?: boolean;
};
const GrupNode = memo((props: GrupNodeProps) => {
  const { data, selected, isConnectable, hideDuration } = props;
  const durationValue =
    typeof data?.groupDurationDays === 'number' && Number.isFinite(data.groupDurationDays)
      ? data.groupDurationDays
      : null;
  const formattedDuration =
    durationValue !== null
      ? (Math.round(durationValue * 10) / 10).toString()
      : null;

  return (
    <>
      <NodeResizer minWidth={200} minHeight={150} isVisible={selected} />
      <Handle
        className="grup-node-handle"
        type={'both' as any}
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
      />
      <Handle
        className="grup-node-handle"
        type={'both' as any}
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
      />
      <Handle
        className="grup-node-handle"
        type={'both' as any}
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
      />
      <Handle
        className="grup-node-handle"
        type={'both' as any}
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
      />

      <div className="grup-node-wrapper">
        <div className="grup-node-header">
          <span>{data?.label || 'Grup'}</span>
          {!hideDuration && formattedDuration && (
            <span className="grup-node-duration">{formattedDuration} gun</span>
          )}
        </div>
        {/** Children will be rendered inside by React Flow based on parentId */}
      </div>
    </>
  );
});
export default GrupNode;
