import { useState } from 'react';
import {
  getShiftsForDate,
  isCurrentShift,
  parseIsoDateLocal,
  type ShiftInfo,
} from '@/utils/shiftUtils';

function ShiftOption({
  shift,
  isSelected,
  isCurrent,
  onClick,
}: {
  shift: ShiftInfo;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        background: isSelected ? '#fffbeb' : 'transparent',
        border: isSelected ? '1px solid #f59e0b' : '1px solid transparent',
        marginBottom: '4px',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <div>
        <div
          style={{
            fontSize: '13px',
            fontWeight: isSelected ? 600 : 400,
            color: '#111827',
          }}
        >
          {shift.shiftName}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          {shift.timeRange} · №{shift.number}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {isCurrent ? (
          <span
            style={{
              fontSize: '10px',
              background: '#dcfce7',
              color: '#166534',
              padding: '2px 6px',
              borderRadius: '10px',
              fontWeight: 600,
            }}
          >
            Сейчас
          </span>
        ) : null}
        {isSelected ? <span style={{ color: '#b45309', fontSize: '14px' }}>✓</span> : null}
      </div>
    </div>
  );
}

type Props = {
  selectedShift: ShiftInfo;
  onShiftSelect: (s: ShiftInfo) => void;
};

export function ShiftSelector({ selectedShift, onShiftSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [pickedDate, setPickedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0] ?? '';
  });

  const todayShifts = getShiftsForDate(new Date());
  const yesterdayShifts = getShiftsForDate(new Date(Date.now() - 86400000));

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          background: '#fff',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          color: '#374151',
          whiteSpace: 'nowrap',
        }}
      >
        <span>📅</span>
        <span>{selectedShift.label}</span>
        <span style={{ color: '#9ca3af', fontSize: '11px' }}>{selectedShift.shiftName}</span>
        <span style={{ color: '#9ca3af' }}>▾</span>
      </button>

      {open ? (
        <>
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 10 }}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              zIndex: 20,
              minWidth: '280px',
              padding: '12px',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Сегодня
              </div>
              {todayShifts.map((shift) => (
                <ShiftOption
                  key={shift.number}
                  shift={shift}
                  isSelected={shift.number === selectedShift.number}
                  isCurrent={isCurrentShift(shift)}
                  onClick={() => {
                    onShiftSelect(shift);
                    setOpen(false);
                  }}
                />
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Вчера
              </div>
              {yesterdayShifts.map((shift) => (
                <ShiftOption
                  key={shift.number}
                  shift={shift}
                  isSelected={shift.number === selectedShift.number}
                  isCurrent={false}
                  onClick={() => {
                    onShiftSelect(shift);
                    setOpen(false);
                  }}
                />
              ))}
            </div>

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                }}
              >
                Выбрать дату
              </div>
              <input
                type="date"
                value={pickedDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPickedDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  fontSize: '13px',
                  marginBottom: '8px',
                }}
              />
              {getShiftsForDate(parseIsoDateLocal(pickedDate)).map((shift) => (
                <ShiftOption
                  key={shift.number}
                  shift={shift}
                  isSelected={shift.number === selectedShift.number}
                  isCurrent={isCurrentShift(shift)}
                  onClick={() => {
                    onShiftSelect(shift);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
