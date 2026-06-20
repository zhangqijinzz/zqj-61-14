import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar, Lock } from "lucide-react"
import { useGameStore } from "@/store/useGameStore"
import { defaultMissions } from "@/data/missions"
import type { Mission } from "@/types"
import {
  getWeekKey,
  isCurrentWeek,
  getWeekLabel,
  generateWeekKeys,
  formatDate,
  getWeekStart,
} from "@/lib/utils"

const emojiOptions = ["🎯", "🎨", "🏃‍♂️", "🎵", "📝", "🧹", "🌻", "🤗"]

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const staggerItem = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
}

export default function Contract() {
  const navigate = useNavigate()
  const missions = useGameStore((s) => s.missions)
  const toggleMission = useGameStore((s) => s.toggleMission)
  const addMission = useGameStore((s) => s.addMission)
  const removeMission = useGameStore((s) => s.removeMission)
  const ensureWeekArchive = useGameStore((s) => s.ensureWeekArchive)
  const getMissionsByWeek = useGameStore((s) => s.getMissionsByWeek)

  const [selectedWeekKey, setSelectedWeekKey] = useState(getWeekKey())
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newEmoji, setNewEmoji] = useState("🎯")
  const [showWeekPicker, setShowWeekPicker] = useState(false)

  useEffect(() => {
    ensureWeekArchive()
  }, [ensureWeekArchive])

  useEffect(() => {
    if (missions.length === 0) {
      defaultMissions.forEach((m) => addMission(m))
    }
  }, [])

  const weekOptions = useMemo(() => generateWeekKeys(8), [])

  const isReadonly = !isCurrentWeek(selectedWeekKey)

  const displayMissions = useMemo(
    () => getMissionsByWeek(selectedWeekKey),
    [selectedWeekKey, getMissionsByWeek]
  )

  const completedCount = displayMissions.filter((m) => m.completed).length
  const totalCount = displayMissions.length
  const allCompleted = totalCount > 0 && completedCount === totalCount
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const currentWeekIndex = weekOptions.findIndex((w) => w === selectedWeekKey)

  const handlePrevWeek = () => {
    if (currentWeekIndex < weekOptions.length - 1) {
      setSelectedWeekKey(weekOptions[currentWeekIndex + 1])
    }
  }

  const handleNextWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeekKey(weekOptions[currentWeekIndex - 1])
    }
  }

  const handleSubmit = () => {
    if (!newTitle.trim()) return
    const mission: Mission = {
      id: `mission-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      completed: false,
      weekStart: formatDate(getWeekStart()),
      emoji: newEmoji,
    }
    addMission(mission)
    setNewTitle("")
    setNewDesc("")
    setNewEmoji("🎯")
    setShowModal(false)
  }

  const hasData = totalCount > 0

  return (
    <div className="min-h-screen bg-adventure-cream pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-6"
        >
          <h1 className="section-title text-3xl">📜 父女任务契约</h1>
          <p className="font-body text-adventure-blue/60 mt-1">
            每周一个小目标，让陪伴更有仪式感
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-6"
        >
          <div className="relative">
            <button
              onClick={() => setShowWeekPicker(!showWeekPicker)}
              className="w-full card-adventure flex items-center justify-between px-4 py-3 cursor-pointer hover:border-adventure-orange transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-adventure-orange" />
                <span className="font-display text-adventure-blue">
                  {isReadonly ? "历史周 · " : "本周 · "}
                  {getWeekLabel(selectedWeekKey)}
                </span>
                {isReadonly && (
                  <Lock className="w-4 h-4 text-adventure-blue/40" />
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePrevWeek()
                  }}
                  disabled={currentWeekIndex >= weekOptions.length - 1}
                  className="p-1.5 rounded-lg hover:bg-adventure-blue/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-adventure-blue/60" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextWeek()
                  }}
                  disabled={currentWeekIndex <= 0}
                  className="p-1.5 rounded-lg hover:bg-adventure-blue/5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-adventure-blue/60" />
                </button>
              </div>
            </button>

            <AnimatePresence>
              {showWeekPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 card-adventure !p-2 z-20 shadow-lg"
                >
                  {weekOptions.map((weekKey, index) => {
                    const isSelected = weekKey === selectedWeekKey
                    const isCurrent = isCurrentWeek(weekKey)
                    return (
                      <button
                        key={weekKey}
                        onClick={() => {
                          setSelectedWeekKey(weekKey)
                          setShowWeekPicker(false)
                        }}
                        className={`w-full px-4 py-2.5 rounded-xl text-left flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-adventure-orange/15 border border-adventure-orange/40"
                            : "hover:bg-adventure-blue/5"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${isSelected ? "text-adventure-orange" : "text-adventure-blue/40"}`} />
                          <span className={`font-display ${isSelected ? "text-adventure-orange" : "text-adventure-blue"}`}>
                            {isCurrent ? "本周 · " : ""}
                            {getWeekLabel(weekKey)}
                          </span>
                        </div>
                        {!isCurrent && <Lock className="w-3.5 h-3.5 text-adventure-blue/30" />}
                      </button>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {hasData ? (
            <motion.div
              key="has-data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={`card-adventure mb-6 ${isReadonly ? "!bg-gray-50 border-gray-200" : ""}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display text-adventure-blue">
                    {isReadonly ? "该周完成 " : "本周完成 "}
                    {completedCount} / {totalCount} 项
                  </span>
                  <span className="font-display text-adventure-orange text-sm">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      isReadonly
                        ? "bg-gradient-to-r from-gray-400 to-gray-300"
                        : "bg-gradient-to-r from-adventure-teal to-adventure-teal/70"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                {isReadonly && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-200">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-body text-xs text-gray-500">
                      历史周数据已归档，不可修改
                    </span>
                  </div>
                )}
              </motion.div>

              <AnimatePresence>
                {allCompleted && !isReadonly && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-adventure mb-6 text-center bg-gradient-to-b from-adventure-gold/20 to-adventure-orange/10 border-2 border-adventure-gold"
                  >
                    <span className="text-4xl block mb-2">🎉</span>
                    <h3 className="font-display text-xl text-adventure-blue mb-2">
                      恭喜！本周任务全部完成！
                    </h3>
                    <p className="font-body text-adventure-blue/60 mb-4">
                      你和女儿的契约全部兑现，太棒了！
                    </p>
                    <button
                      onClick={() => navigate("/contract/mini-game/puzzle")}
                      className="btn-adventure"
                    >
                      🎮 解锁双人小游戏!
                    </button>
                  </motion.div>
                )}
                {allCompleted && isReadonly && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-adventure mb-6 text-center bg-gradient-to-b from-gray-100 to-gray-50 border-2 border-gray-300"
                  >
                    <span className="text-4xl block mb-2">✅</span>
                    <h3 className="font-display text-xl text-gray-700 mb-2">
                      该周任务全部完成！
                    </h3>
                    <p className="font-body text-gray-500">
                      {getWeekLabel(selectedWeekKey)} 的表现太棒了！
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                key={selectedWeekKey}
                className="space-y-3"
              >
                <AnimatePresence>
                  {displayMissions.map((mission) => (
                    <motion.div
                      key={mission.id}
                      variants={staggerItem}
                      exit="exit"
                      layout
                      className={`border rounded-2xl p-4 transition-opacity ${
                        mission.completed ? "opacity-60" : ""
                      } ${
                        isReadonly
                          ? "bg-gradient-to-b from-gray-50 to-gray-100/50 border-gray-200"
                          : "bg-gradient-to-b from-amber-50 to-orange-50 border-amber-200"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => !isReadonly && toggleMission(mission.id)}
                          disabled={isReadonly}
                          className={`w-6 h-6 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                            isReadonly ? "cursor-default" : "cursor-pointer"
                          } ${
                            mission.completed
                              ? isReadonly
                                ? "bg-gray-400 border-gray-400"
                                : "bg-adventure-teal border-adventure-teal"
                              : "border-amber-300 bg-white"
                          } ${
                            !mission.completed && isReadonly
                              ? "border-gray-300 bg-gray-50"
                              : ""
                          }`}
                        >
                          {mission.completed && (
                            <span className="text-white text-xs font-bold">✓</span>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{mission.emoji}</span>
                            <h3
                              className={`font-display ${
                                mission.completed ? "line-through" : ""
                              } ${
                                isReadonly ? "text-gray-700" : "text-adventure-blue"
                              }`}
                            >
                              {mission.title}
                            </h3>
                          </div>
                          <p className={`font-body text-sm mt-1 ${isReadonly ? "text-gray-500" : "text-adventure-blue/60"}`}>
                            {mission.description}
                          </p>
                        </div>
                        {!isReadonly ? (
                          <button
                            onClick={() => removeMission(mission.id)}
                            className="text-red-400 hover:text-red-500 shrink-0 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <Lock className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card-adventure text-center py-12"
            >
              <span className="text-6xl block mb-4">📭</span>
              <h3 className="font-display text-xl text-adventure-blue mb-2">
                {isCurrentWeek(selectedWeekKey) ? "本周还没有契约" : "该周没有契约记录"}
              </h3>
              <p className="font-body text-adventure-blue/60 mb-6">
                {isCurrentWeek(selectedWeekKey)
                  ? "添加一些和女儿的任务契约吧"
                  : `${getWeekLabel(selectedWeekKey)} 没有创建过契约`}
              </p>
              {isCurrentWeek(selectedWeekKey) && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-adventure"
                >
                  <Plus className="w-5 h-5" />
                  添加第一个契约
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isReadonly && hasData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <button
              onClick={() => setShowModal(true)}
              className="btn-adventure w-full"
            >
              <Plus className="w-5 h-5" />
              添加新契约
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl text-adventure-blue mb-4">
                添加新契约
              </h3>

              <div className="mb-4">
                <label className="font-body text-sm text-adventure-blue/70 mb-1 block">
                  选择图标
                </label>
                <div className="flex flex-wrap gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewEmoji(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center cursor-pointer transition-all ${
                        newEmoji === emoji
                          ? "bg-adventure-orange/20 border-2 border-adventure-orange scale-110"
                          : "bg-amber-50 border-2 border-transparent"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="font-body text-sm text-adventure-blue/70 mb-1 block">
                  契约标题
                </label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：一起做手工"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 font-body text-adventure-blue focus:border-adventure-orange focus:outline-none transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="font-body text-sm text-adventure-blue/70 mb-1 block">
                  契约描述
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="描述一下这个契约的内容..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-amber-200 font-body text-adventure-blue focus:border-adventure-orange focus:outline-none resize-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn-ghost flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-adventure flex-1"
                >
                  确认添加
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
