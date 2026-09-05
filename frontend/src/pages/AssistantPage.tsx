import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Send, Sparkles, BookOpen, Brain, MessageSquare } from 'lucide-react'
import api from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { StudyMaterial } from '../types'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function AssistantPage() {
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'summarize' | 'keypoints' | 'quiz'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')

  // Fetch materials
  const { data: materials = [] } = useQuery({
    queryKey: queryKeys.materials.all,
    queryFn: async () => {
      const res = await api.get('/api/v1/materials')
      return res.data
    },
  })

  // Chat mutation
  const chat = useMutation({
    mutationFn: async ({ question, history }: { question: string; history: ChatMessage[] }) => {
      const res = await api.post('/api/v1/ai/assistant/chat', {
        material_ids: selectedMaterials,
        question,
        history,
      })
      return res.data
    },
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    },
  })

  // Summarize mutation
  const summarize = useMutation({
    mutationFn: async () => {
      if (selectedMaterials.length === 0) {
        throw new Error('Please select at least one material')
      }
      const res = await api.post('/api/v1/ai/assistant/summarize', {
        material_id: selectedMaterials[0], // Backend expects single material_id
      })
      return res.data
    },
  })

  // Key points mutation
  const keyPoints = useMutation({
    mutationFn: async () => {
      if (selectedMaterials.length === 0) {
        throw new Error('Please select at least one material')
      }
      const res = await api.post('/api/v1/ai/assistant/key-points', {
        material_id: selectedMaterials[0], // Backend expects single material_id
      })
      return res.data
    },
  })

  // Quiz mutation
  const quiz = useMutation({
    mutationFn: async (count: number) => {
      if (selectedMaterials.length === 0) {
        throw new Error('Please select at least one material')
      }
      const res = await api.post('/api/v1/ai/assistant/quiz', {
        material_id: selectedMaterials[0], // Backend expects single material_id
      })
      return res.data
    },
  })

  const handleSendMessage = () => {
    if (!input.trim() || selectedMaterials.length === 0) return

    const userMessage: ChatMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    chat.mutate({ question: input, history: messages })
  }

  const toggleMaterial = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-indigo-600" />
          AI Study Assistant
        </h1>
        <p className="text-gray-600 mt-2">
          Select up to 3 study materials and ask questions, get summaries, or generate quizzes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Material Selection Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Select Materials ({selectedMaterials.length}/3)
            </h3>
            {materials.length === 0 ? (
              <p className="text-sm text-gray-500">No materials available. Upload some first!</p>
            ) : (
              <div className="space-y-2">
                {materials.map((material: StudyMaterial) => (
                  <label
                    key={material.id}
                    className={`flex items-start gap-2 p-2 rounded cursor-pointer transition-colors ${
                      selectedMaterials.includes(material.id)
                        ? 'bg-indigo-50 border-2 border-indigo-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material.id)}
                      onChange={() => toggleMaterial(material.id)}
                      disabled={
                        selectedMaterials.length >= 3 && !selectedMaterials.includes(material.id)
                      }
                      className="mt-1"
                    />
                    <span className="text-sm flex-1">{material.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          {/* Tabs */}
          <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200">
            <div className="flex gap-1 p-2">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('summarize')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'summarize'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Summarize
              </button>
              <button
                onClick={() => setActiveTab('keypoints')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'keypoints'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Brain className="w-4 h-4" />
                Key Points
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'quiz'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Generate Quiz
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-b-lg shadow-sm">
            {activeTab === 'chat' && (
              <ChatTab
                messages={messages}
                input={input}
                setInput={setInput}
                onSend={handleSendMessage}
                isLoading={chat.isPending}
                disabled={selectedMaterials.length === 0}
              />
            )}

            {activeTab === 'summarize' && (
              <SummarizeTab
                onGenerate={() => summarize.mutate()}
                result={summarize.data}
                isLoading={summarize.isPending}
                disabled={selectedMaterials.length === 0}
              />
            )}

            {activeTab === 'keypoints' && (
              <KeyPointsTab
                onGenerate={() => keyPoints.mutate()}
                result={keyPoints.data}
                isLoading={keyPoints.isPending}
                disabled={selectedMaterials.length === 0}
              />
            )}

            {activeTab === 'quiz' && (
              <QuizTab
                onGenerate={(count) => quiz.mutate(count)}
                result={quiz.data}
                isLoading={quiz.isPending}
                disabled={selectedMaterials.length === 0}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Chat Tab
function ChatTab({
  messages,
  input,
  setInput,
  onSend,
  isLoading,
  disabled,
}: {
  messages: ChatMessage[]
  input: string
  setInput: (v: string) => void
  onSend: () => void
  isLoading: boolean
  disabled: boolean
}) {
  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p>Select materials and ask a question to start chatting!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <p className="text-gray-600">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !disabled && onSend()}
            disabled={disabled}
            placeholder={disabled ? 'Select materials first...' : 'Ask a question...'}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={onSend}
            disabled={disabled || !input.trim() || isLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// Summarize Tab
function SummarizeTab({
  onGenerate,
  result,
  isLoading,
  disabled,
}: {
  onGenerate: () => void
  result: any
  isLoading: boolean
  disabled: boolean
}) {
  return (
    <div className="p-6">
      <button
        onClick={onGenerate}
        disabled={disabled || isLoading}
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isLoading ? 'Generating summary...' : 'Generate Summary'}
      </button>

      {result && (
        <div className="prose max-w-none">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Summary:</h3>
            <p className="whitespace-pre-wrap text-gray-700">{result.summary}</p>
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="text-center text-gray-500 py-12">
          Click "Generate Summary" to create a concise summary of your selected materials.
        </div>
      )}
    </div>
  )
}

// Key Points Tab
function KeyPointsTab({
  onGenerate,
  result,
  isLoading,
  disabled,
}: {
  onGenerate: () => void
  result: any
  isLoading: boolean
  disabled: boolean
}) {
  return (
    <div className="p-6">
      <button
        onClick={onGenerate}
        disabled={disabled || isLoading}
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isLoading ? 'Extracting key points...' : 'Extract Key Points'}
      </button>

      {result && (
        <div className="space-y-3">
          {result.key_points.map((kp: any, i: number) => {
            const importanceColors = {
              high: 'border-red-500 bg-red-50',
              medium: 'border-yellow-500 bg-yellow-50',
              low: 'border-green-500 bg-green-50',
            }
            return (
              <div
                key={i}
                className={`p-4 rounded-lg border-l-4 ${importanceColors[kp.importance as keyof typeof importanceColors]}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{kp.importance === 'high' ? '🔴' : kp.importance === 'medium' ? '🟡' : '🟢'}</span>
                  <div className="flex-1">
                    <p className="text-gray-900">{kp.point}</p>
                    <span className="text-xs text-gray-600 uppercase mt-1 inline-block">
                      {kp.importance} importance
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!result && !isLoading && (
        <div className="text-center text-gray-500 py-12">
          Click "Extract Key Points" to identify the most important concepts from your materials.
        </div>
      )}
    </div>
  )
}

// Quiz Tab
function QuizTab({
  onGenerate,
  result,
  isLoading,
  disabled,
}: {
  onGenerate: (count: number) => void
  result: any
  isLoading: boolean
  disabled: boolean
}) {
  const [questionCount, setQuestionCount] = useState(5)
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({})
  const [showResults, setShowResults] = useState(false)

  const handleGenerate = () => {
    setSelectedAnswers({})
    setShowResults(false)
    onGenerate(questionCount)
  }

  const handleSubmit = () => {
    setShowResults(true)
  }

  const score = result?.questions.reduce((acc: number, q: any, i: number) => {
    return acc + (selectedAnswers[i] === q.correct_answer ? 1 : 0)
  }, 0)

  return (
    <div className="p-6">
      {!result && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of questions:
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value={3}>3 questions</option>
              <option value={5}>5 questions</option>
              <option value={10}>10 questions</option>
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={disabled || isLoading}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Generating quiz...' : 'Generate Quiz'}
          </button>
        </>
      )}

      {result && (
        <div className="space-y-6">
          {!showResults && (
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Answer the questions:</h3>
              <button
                onClick={handleGenerate}
                className="text-indigo-600 hover:text-indigo-700 text-sm"
              >
                Generate New Quiz
              </button>
            </div>
          )}

          {result.questions.map((q: any, i: number) => (
            <div key={i} className="bg-gray-50 p-6 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-4">
                {i + 1}. {q.question}
              </h4>
              <div className="space-y-2">
                {q.options.map((option: string, optIdx: number) => {
                  const isSelected = selectedAnswers[i] === optIdx
                  const isCorrect = optIdx === q.correct_answer
                  const showCorrectness = showResults

                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        showCorrectness
                          ? isCorrect
                            ? 'bg-green-100 border-2 border-green-500'
                            : isSelected
                            ? 'bg-red-100 border-2 border-red-500'
                            : 'bg-white border-2 border-gray-200'
                          : isSelected
                          ? 'bg-indigo-100 border-2 border-indigo-500'
                          : 'bg-white border-2 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${i}`}
                        checked={isSelected}
                        onChange={() => setSelectedAnswers({ ...selectedAnswers, [i]: optIdx })}
                        disabled={showResults}
                      />
                      <span>{option}</span>
                      {showCorrectness && isCorrect && <span className="ml-auto">✓</span>}
                    </label>
                  )
                })}
              </div>
              {showResults && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-900">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!showResults ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(selectedAnswers).length !== result.questions.length}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Answers
            </button>
          ) : (
            <div className="text-center p-6 bg-indigo-50 rounded-lg">
              <h3 className="text-2xl font-bold text-indigo-900 mb-2">
                Your Score: {score}/{result.questions.length}
              </h3>
              <p className="text-indigo-700">
                {score === result.questions.length
                  ? '🎉 Perfect score!'
                  : score >= result.questions.length * 0.7
                  ? '👍 Good job!'
                  : '📚 Keep studying!'}
              </p>
            </div>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <div className="text-center text-gray-500 py-12 mt-6">
          Select the number of questions and click "Generate Quiz" to test your knowledge!
        </div>
      )}
    </div>
  )
}
