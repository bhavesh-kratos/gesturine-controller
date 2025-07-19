import React, { useState, useEffect, useMemo } from 'react'
import { Settings, Plus, Trash2, Edit3, Save, X, Gamepad2, Keyboard } from 'lucide-react'
import { useGestureStore } from '../store/useGestureStore'
import { keybindingService } from '../services/KeybindingService'
import type { Keybinding } from '../store/useGestureStore'

interface Gesture {
  id: string
  name: string
  icon: string
  description: string
}

const SettingsScreen: React.FC = () => {
  const {
    activeProfile,
    profiles,
    keybindings,
    searchQuery,
    setActiveProfile,
    addBinding,
    updateBinding,
    deleteBinding,
    toggleBinding,
    addProfile,
    deleteProfile,
    setSearchQuery
  } = useGestureStore()

  const [editingBinding, setEditingBinding] = useState<Keybinding | null>(null)
  const [isAddingProfile, setIsAddingProfile] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')

  const filteredProfiles = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return Object.keys(profiles).filter((profile) => profile.toLowerCase().includes(query))
  }, [profiles, searchQuery])

  const handleAddProfile = (): void => {
    if (newProfileName.trim()) {
      addProfile(newProfileName.trim())
      setNewProfileName('')
      setIsAddingProfile(false)
    }
  }

  // Available gestures with descriptions and icons
  const availableGestures: Gesture[] = [
    { id: 'fist', name: 'Fist', icon: '✊', description: 'Closed fist' },
    {
      id: 'open_palm',
      name: 'Open Palm',
      icon: '✋',
      description: 'Open hand, all fingers extended'
    },
    { id: 'pointing', name: 'Pointing', icon: '👆', description: 'Index finger extended' },
    {
      id: 'peace_sign',
      name: 'Peace Sign',
      icon: '✌️',
      description: 'Index and middle finger extended'
    },
    { id: 'thumbs_up', name: 'Thumbs Up', icon: '👍', description: 'Thumb pointing up' },
    { id: 'thumbs_down', name: 'Thumbs Down', icon: '👎', description: 'Thumb pointing down' },
    { id: 'ok_sign', name: 'OK Sign', icon: '👌', description: 'Thumb and index finger circle' },
    { id: 'rock_on', name: 'Rock On', icon: '🤘', description: 'Index and pinky extended' }
  ]

  // Common key combinations
  const commonKeys = [
    { label: 'Space', value: 'space' },
    { label: 'Enter', value: 'enter' },
    { label: 'Escape', value: 'escape' },
    { label: 'Tab', value: 'tab' },
    { label: 'Ctrl+C', value: 'ctrl+c' },
    { label: 'Ctrl+V', value: 'ctrl+v' },
    { label: 'Ctrl+Z', value: 'ctrl+z' },
    { label: 'Alt+Tab', value: 'alt+tab' },
    { label: 'F1', value: 'f1' },
    { label: 'F2', value: 'f2' },
    { label: 'F3', value: 'f3' },
    { label: 'F4', value: 'f4' }
  ]

  // Update keybinding service when bindings change
  useEffect(() => {
    keybindingService.updateBindings(keybindings)
  }, [keybindings])

  const handleAddNewBinding = (): void => {
    const newBinding: Keybinding = {
      id: 'new',
      gesture: '',
      keyBinding: '',
      description: '',
      enabled: true,
      hand: 'any'
    }
    setEditingBinding(newBinding)
  }

  const handleSaveBinding = (binding: Keybinding): void => {
    if (binding.id === 'new') {
      addBinding({ ...binding, id: Date.now() })
    } else {
      updateBinding(binding)
    }
    setEditingBinding(null)
  }

  const BindingEditor: React.FC<{
    binding: Keybinding
    onSave: (b: Keybinding) => void
    onCancel: () => void
  }> = ({ binding, onSave, onCancel }) => {
    const [editedBinding, setEditedBinding] = useState<Keybinding>(binding)
    const [recordingKey, setRecordingKey] = useState<boolean>(false)

    const handleKeyRecord = (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (!recordingKey) return

      e.preventDefault()
      const keys: string[] = []

      if (e.ctrlKey) keys.push('ctrl')
      if (e.altKey) keys.push('alt')
      if (e.shiftKey) keys.push('shift')
      if (e.metaKey) keys.push('cmd')

      if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
        keys.push(e.key.toLowerCase())
      }

      const keyBinding = keys.join('+')
      setEditedBinding((prev) => ({ ...prev, keyBinding }))
      setRecordingKey(false)
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-w-md">
          <h3 className="text-lg font-semibold mb-4">
            {binding.id === 'new' ? 'Add New Binding' : 'Edit Binding'}
          </h3>

          <div className="space-y-4">
            {/* Gesture Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Gesture</label>
              <select
                value={editedBinding.gesture}
                onChange={(e) => setEditedBinding((prev) => ({ ...prev, gesture: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Gesture</option>
                {availableGestures.map((gesture) => (
                  <option key={gesture.id} value={gesture.id}>
                    {gesture.icon} {gesture.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Key Binding */}
            <div>
              <label className="block text-sm font-medium mb-2">Key Binding</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedBinding.keyBinding}
                  onChange={(e) =>
                    setEditedBinding((prev) => ({ ...prev, keyBinding: e.target.value }))
                  }
                  className="flex-1 p-2 border rounded-md"
                  placeholder="e.g., ctrl+c, space, f1"
                  onKeyDown={handleKeyRecord}
                />
                <button
                  onClick={() => setRecordingKey(!recordingKey)}
                  className={`px-3 py-2 rounded-md text-sm ${
                    recordingKey
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {recordingKey ? 'Recording...' : 'Record'}
                </button>
              </div>

              {/* Quick Key Selection */}
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Quick select:</div>
                <div className="flex flex-wrap gap-1">
                  {commonKeys.map((key) => (
                    <button
                      key={key.value}
                      onClick={() =>
                        setEditedBinding((prev) => ({ ...prev, keyBinding: key.value }))
                      }
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      {key.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hand Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Hand</label>
              <select
                value={editedBinding.hand}
                onChange={(e) =>
                  setEditedBinding((prev) => ({
                    ...prev,
                    hand: e.target.value as 'left' | 'right' | 'any'
                  }))
                }
                className="w-full p-2 border rounded-md"
              >
                <option value="any">Any Hand</option>
                <option value="left">Left Hand Only</option>
                <option value="right">Right Hand Only</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <input
                type="text"
                value={editedBinding.description}
                onChange={(e) =>
                  setEditedBinding((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full p-2 border rounded-md"
                placeholder="e.g., Jump in game, Copy text"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={() => onSave(editedBinding)}
              disabled={!editedBinding.gesture || !editedBinding.keyBinding}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="inline w-4 h-4 mr-2" />
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
            >
              <X className="inline w-4 h-4 mr-2" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-gray-600">Configure gesture-to-key mappings for your applications</p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {/* <button
              onClick={() => setShowGesturePreview(!showGesturePreview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              {showGesturePreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Gesture Preview
            </button> */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Profiles & Gestures */}
        <div className="lg:col-span-1">
          {/* Profile Selection */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Profiles</h3>
              <button
                onClick={() => setIsAddingProfile(true)}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                New Profile
              </button>
            </div>

            {/* Profile Search */}
            <div className="mb-3">
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-2 text-sm border rounded-md"
              />
            </div>

            <div className="space-y-2">
              {filteredProfiles.map((profile) => (
                <button
                  key={profile}
                  onClick={() => setActiveProfile(profile)}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeProfile === profile
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      {profile === 'Gaming' && <Gamepad2 className="w-4 h-4" />}
                      {profile === 'Productivity' && <Keyboard className="w-4 h-4" />}
                      {profile === 'Custom' && <Edit3 className="w-4 h-4" />}
                      <span>{profile}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm opacity-75">
                        {(profiles[profile] || []).length} bindings
                      </span>
                      {profile !== 'Gaming' &&
                        profile !== 'Productivity' &&
                        profile !== 'Custom' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteProfile(profile)
                            }}
                            className="p-1 text-gray-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gesture Reference */}
          {/* {showGesturePreview && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Available Gestures</h3>
              <div className="space-y-2">
                {availableGestures.map((gesture) => (
                  <div
                    key={gesture.id}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-xl">{gesture.icon}</span>
                    <div>
                      <div className="font-medium text-sm">{gesture.name}</div>
                      <div className="text-xs text-gray-600">{gesture.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>

        {/* Main Content - Keybindings */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">{activeProfile} Profile</h2>
              <button
                onClick={handleAddNewBinding}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Add Binding
              </button>
            </div>

            {/* Add Profile Modal */}
            {isAddingProfile && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96 max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Add New Profile</h3>
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Enter profile name"
                    className="w-full p-2 border rounded-md mb-4"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddProfile}
                      disabled={!newProfileName.trim()}
                      className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      Add Profile
                    </button>
                    <button
                      onClick={() => {
                        setNewProfileName('')
                        setIsAddingProfile(false)
                      }}
                      className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Keybindings List */}
            <div className="p-4">
              {keybindings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Gamepad2 className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No keybindings yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start by adding your first gesture-to-key mapping
                  </p>
                  <button
                    onClick={handleAddNewBinding}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    Add First Binding
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {keybindings.map((binding) => {
                    const gesture = availableGestures.find((g) => g.id === binding.gesture)
                    return (
                      <div
                        key={binding.id}
                        className={`p-4 border rounded-lg ${
                          binding.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{gesture?.icon}</span>
                              <div>
                                <div className="font-medium">{gesture?.name}</div>
                                <div className="text-sm text-gray-600">{gesture?.description}</div>
                              </div>
                            </div>

                            <div className="text-2xl text-gray-400">→</div>

                            <div className="bg-gray-100 px-3 py-1 rounded-md font-mono text-sm">
                              {binding.keyBinding}
                            </div>

                            {binding.hand !== 'any' && (
                              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {binding.hand} hand
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleBinding(binding.id)}
                              className={`px-3 py-1 rounded-md text-sm ${
                                binding.enabled
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {binding.enabled ? 'Enabled' : 'Disabled'}
                            </button>

                            <button
                              onClick={() => setEditingBinding(binding)}
                              className="p-2 text-gray-500 hover:text-blue-600"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => deleteBinding(binding.id)}
                              className="p-2 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {binding.description && (
                          <div className="mt-2 text-sm text-gray-600">{binding.description}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Binding Editor Modal */}
      {editingBinding && (
        <BindingEditor
          binding={editingBinding}
          onSave={handleSaveBinding}
          onCancel={() => setEditingBinding(null)}
        />
      )}
    </div>
  )
}

export default SettingsScreen
