// client/src/components/Checklist.tsx
// Embeddable checklist for subtasks — drop inside TaskDetailModal

import { useState } from 'react'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

interface Props {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

export default function Checklist({ items, onChange }: Props) {
  const [newText, setNewText] = useState('')

  const toggle = (id: string) => {
    onChange(items.map((i) => i.id === id ? { ...i, done: !i.done } : i))
  }

  const remove = (id: string) => {
    onChange(items.filter((i) => i.id !== id))
  }

  const add = () => {
    if (!newText.trim()) return
    const item: ChecklistItem = {
      id: `${Date.now()}`,
      text: newText.trim(),
      done: false,
    }
    onChange([...items, item])
    setNewText('')
  }

  const doneCount = items.filter((i) => i.done).length
  const progress = items.length ? Math.round((doneCount / items.length) * 100) : 0

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header + progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ color: '#8892b0', fontSize: 12 }}>
          Checklist {items.length > 0 && `— ${doneCount}/${items.length}`}
        </label>
        {items.length > 0 && (
          <span style={{ color: '#8892b0', fontSize: 11 }}>{progress}%</span>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div style={{
          height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)',
          marginBottom: 10, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            borderRadius: 4,
            background: progress === 100 ? '#34d399' : '#6366f1',
            transition: 'width 0.4s ease, background 0.3s ease',
          }} />
        </div>
      )}

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 10px', borderRadius: 8,
              background: item.done ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${item.done ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.2s ease',
            }}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggle(item.id)}
              style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `2px solid ${item.done ? '#34d399' : 'rgba(255,255,255,0.2)'}`,
                background: item.done ? '#34d399' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>

            {/* Text */}
            <span style={{
              flex: 1, fontSize: 13, color: item.done ? '#8892b0' : '#e8eaf6',
              textDecoration: item.done ? 'line-through' : 'none',
              transition: 'all 0.2s ease',
            }}>
              {item.text}
            </span>

            {/* Delete */}
            <button
              onClick={() => remove(item.id)}
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
                cursor: 'pointer', padding: 2, borderRadius: 4, lineHeight: 1,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add subtask…"
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            padding: '7px 12px', fontSize: 13, color: '#e8eaf6', outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#6366f1')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
        <button
          onClick={add}
          disabled={!newText.trim()}
          style={{
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#818cf8', borderRadius: 8, padding: '7px 14px',
            fontSize: 13, cursor: newText.trim() ? 'pointer' : 'not-allowed',
            opacity: newText.trim() ? 1 : 0.4, transition: 'all 0.15s',
          }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}
