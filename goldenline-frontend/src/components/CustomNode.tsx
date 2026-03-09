import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import './CustomNode.css';
import { resolveMediaUrl } from '../api/media';
import { Settings2, ClipboardList, FlaskConical } from 'lucide-react';

const hasData = (obj: any): boolean => {
  if (obj === null || obj === undefined || obj === '') return false;

  if (Array.isArray(obj)) {
    return obj.some(item => hasData(item));
  }

  if (typeof obj === 'object') {
    // If it's an empty object, return false
    const values = Object.values(obj);
    if (values.length === 0) return false;
    // Check if any property in the object has real data
    return values.some(val => hasData(val));
  }

  return true; // For primitives like numbers or non-empty strings
};

type CustomNodeData = {
  label: string;
  machineType?: string;
  completion?: number;
  department?: string;
  duration?: number | string;
  imagePath?: string | null;
  __isCritical?: boolean;
  utilities?: any;
  specification?: any;
  quality?: any;
};

type CustomNodeProps = {
  data: CustomNodeData;
  isConnectable?: boolean;
  isSimpleMode?: boolean;
};

const CustomNode = memo((props: CustomNodeProps) => {
  const { data, isConnectable, isSimpleMode = false } = props;

  const getDepartmentClass = (department: string | undefined) => {
    if (!department) return '';
    switch (department) {
      case 'Mekanik':
        return 'node-mekanik';
      case 'Elektrik':
        return 'node-elektrik';
      case 'Akışkan':
        return 'node-akiskan';
      default:
        return '';
    }
  };

  const departmentClass = getDepartmentClass(data?.department);
  const isCritical = Boolean(data?.__isCritical);
  const wrapperClasses = ['custom-node-wrapper', departmentClass];
  if (isCritical) {
    wrapperClasses.push('critical');
  }
  const imageUrl = resolveMediaUrl(data?.imagePath ?? undefined);

  return (
    <div className={wrapperClasses.filter(Boolean).join(' ')}>
      <Handle type={'both' as any} position={Position.Top} id="top" isConnectable={isConnectable} />
      <Handle type={'both' as any} position={Position.Right} id="right" isConnectable={isConnectable} />
      <Handle type={'both' as any} position={Position.Bottom} id="bottom" isConnectable={isConnectable} />
      <Handle type={'both' as any} position={Position.Left} id="left" isConnectable={isConnectable} />

      <div className="custom-node-content">
        {data?.machineType && (
          <div className="custom-node-type">
            {data.machineType}
          </div>
        )}
        <div className="custom-node-title leading-tight">{data?.label}</div>
        {!isSimpleMode && (
          <>
            {data?.department && (
              <div className="custom-node-meta">
                Departman: {data.department}
              </div>
            )}
            {(data?.duration !== undefined && data?.duration !== null) && (
              <div className="custom-node-meta">
                Sure: {data.duration} {Number(data.duration) === 1 ? 'gun' : 'gun'}
              </div>
            )}
            {typeof data?.completion === 'number' && !Number.isNaN(data.completion) && (
              <div className="custom-node-meta">
                Tamamlanma: {data.completion}%
              </div>
            )}
          </>
        )}
        {imageUrl && (
          <div className="custom-node-image">
            <img src={imageUrl} alt={data?.label ?? 'Node'} />
          </div>
        )}

        {isSimpleMode && (
          <div className="node-badges">
            {hasData(data?.utilities) && (
              <div className="node-badge text-blue-500" title="Utilities Dolduruldu">
                <Settings2 size={12} strokeWidth={2.5} />
              </div>
            )}
            {hasData(data?.specification) && (
              <div className="node-badge text-amber-500" title="Line Specification Dolduruldu">
                <ClipboardList size={12} strokeWidth={2.5} />
              </div>
            )}
            {hasData(data?.quality) && (
              <div className="node-badge text-emerald-500" title="Kalite Kontrol Verileri Dolduruldu">
                <FlaskConical size={12} strokeWidth={2.5} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default CustomNode;
