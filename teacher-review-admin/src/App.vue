<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, type Component } from 'vue'
import { Aim, Bell, Calendar, CircleClose, Collection, EditPen, Expand, Flag, Grid, Loading, Menu, Monitor, Notebook, Plus, Reading, Refresh, Search, Setting, SwitchButton, Timer, TrendCharts, Trophy, UploadFilled, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadFile } from 'element-plus'

type Status = '休假中' | '授课中' | '未授课'
type AuditStatus = '待审核' | '审核通过' | '已驳回'
interface Teacher { id:string; name:string; initials:string; level:string; type:string; phone:string; wechat:string; subjects:string[]; grades:string[]; tags:string[]; hours:number; rating:number; status:Status; online:boolean; auditStatus:AuditStatus; date:string; city:string; school:string; education:string; experience:number; intro:string; originalPortraitUrl?:string; aiPortraitUrl?:string }
interface Query { name:string; wechat:string; phone:string; level:string; subject:string; auditStatus:string; range:string[] }
interface SharedTeacherApplication { id:string; name:string; phone:string; teacherType:string; experienceRange?:string; experience?:number; school:string; education:string; grades:string[]; subjects:string[]; intro:string; submittedAt:string }
interface IntroTemplate { id:string; title:string; content:string; enabled:boolean; updatedAt:string }
type BuiltInFocusIcon = 'monitor' | 'trend' | 'flag' | 'setting' | 'reading' | 'collection' | 'calendar' | 'timer' | 'notebook' | 'trophy' | 'aim'
interface TeachingFocusItem { id:string; icon:string; title:string; subtitle:string }
interface TeachingAchievementItem { id:string; icon:string; title:string; subtitle:string; highlight:string; enabled:boolean }
interface TeacherTag { id:string; name:string; enabled:boolean; source:string; sort:number; updatedAt:string }
interface TeacherTagDraft { id:string; name:string; enabled:boolean; sort:number }
interface TeacherTypeItem { id:string; name:string; sort:number; enabled:boolean }
interface TeacherTypeDraft { id:string; name:string; sort:number; enabled:boolean }
interface ContentTemplateSettings { intros:IntroTemplate[]; focusItems:TeachingFocusItem[]; achievements:TeachingAchievementItem[] }
interface StoredContentTemplateSettings extends Partial<ContentTemplateSettings> { focusTags?:string[] }
function cloneTeacher(teacher: Teacher): Teacher { return { ...teacher, subjects: [...teacher.subjects], grades: [...teacher.grades], tags: [...teacher.tags] } }
const queryRef = ref<FormInstance>()
const urlParams = new URLSearchParams(window.location.search)
const embedded = urlParams.get('embedded') === '1'
const contentTemplatePage = urlParams.get('view') === 'content-templates'
const query = reactive<Query>({ name:'',wechat:'',phone:'',level:'',subject:'',auditStatus:'',range:[] })
function normalizeTeachingExperience(value: unknown): number {
  const legacyRanges: Record<string, number> = { '3年以内':3, '3-5年':4, '5-10年':7, '10年以上':11 }
  const years = typeof value === 'string' && value in legacyRanges ? legacyRanges[value] : Number(value)
  return Number.isFinite(years) && years >= 0 ? Math.min(99, Math.round(years)) : 0
}
const rows = ref<Teacher[]>([
  {id:'100101',name:'王涛',initials:'王',level:'特级教师',type:'骨干教员',phone:'130****8881',wechat:'QW20260427WJT',subjects:['编程'],grades:['小学','初一-初二'],tags:['优秀教师','985/211'],hours:0,rating:5,status:'休假中',online:false,auditStatus:'待审核',date:'2026-04-27 10:16:42',city:'东方学院',school:'北京大学',education:'硕士研究生',experience:12,intro:'风趣幽默，擅长词汇、翻译和高分写作，有证书。'},
  {id:'900111',name:'万毅盈',initials:'万',level:'普通讲师',type:'骨干教员',phone:'130****9664',wechat:'-',subjects:['语文','数学','英语'],grades:['小学','初一-初二'],tags:['四六级'],hours:0,rating:0,status:'未授课',online:false,auditStatus:'待审核',date:'2026-06-18 14:32:18',city:'重庆市',school:'-',education:'本科',experience:3,intro:'专注小学学科辅导。'},
  {id:'900118',name:'王鹤',initials:'王',level:'普通讲师',type:'骨干教员',phone:'130****9854',wechat:'-',subjects:['数学','语文','英语'],grades:['小学','初一-初二'],tags:['优秀教师','零投诉'],hours:900,rating:0,status:'授课中',online:true,auditStatus:'审核通过',date:'2026-06-18 14:32:18',city:'杭州市',school:'浙江大学',education:'本科',experience:7,intro:'擅长同步提升与学习习惯培养。'},
  {id:'900116',name:'刘老师',initials:'刘',level:'普通讲师',type:'专业教员',phone:'151****4147',wechat:'-',subjects:['语文','数学'],grades:['小学','初一-初二'],tags:['竞赛导师'],hours:0,rating:0,status:'授课中',online:true,auditStatus:'审核通过',date:'2026-06-18 14:32:18',city:'上海市',school:'华东师范大学',education:'本科',experience:8,intro:'小学语文、数学教学经验丰富。'},
  {id:'900117',name:'李老师',initials:'李',level:'普通讲师',type:'专业教员',phone:'130****9977',wechat:'76876',subjects:['语文','音乐','生物'],grades:['小学','初一-初二'],tags:['四六级'],hours:0,rating:4.5,status:'授课中',online:true,auditStatus:'已驳回',date:'2026-06-18 14:32:18',city:'南京市',school:'南京师范大学',education:'本科',experience:6,intro:'因材施教，关注孩子成长。'},
  {id:'900119',name:'应教员',initials:'应',level:'普通讲师',type:'骨干教员',phone:'138****8888',wechat:'138888888',subjects:['数学','英语'],grades:['小学','初一-初二'],tags:['高级教师','985/211','零投诉'],hours:689,rating:5,status:'授课中',online:true,auditStatus:'审核通过',date:'2026-06-22 09:48:56',city:'宁波市',school:'宁波大学',education:'本科',experience:8,intro:'擅长数学思维及英语同步辅导。'},
  {id:'900115',name:'刘教员',initials:'刘',level:'普通讲师',type:'骨干教员',phone:'151****4148',wechat:'-',subjects:['语文','数学'],grades:['小学','初一-初二'],tags:['培育名校学子'],hours:856,rating:0,status:'授课中',online:true,auditStatus:'审核通过',date:'2026-06-18 14:32:18',city:'绍兴市',school:'浙江工业大学',education:'本科',experience:6,intro:'认真负责，重视学习方法。'}
])
const filtered = computed(() => rows.value.filter(r => (!query.name || r.name.includes(query.name)) && (!query.wechat || r.wechat.includes(query.wechat)) && (!query.phone || r.phone.includes(query.phone)) && (!query.level || r.level === query.level) && (!query.subject || r.subjects.includes(query.subject)) && (!query.auditStatus || r.auditStatus === query.auditStatus)))
const primarySubjects = ['语文', '数学', '英语']
const subjectOptions = [...primarySubjects, '物理', '化学', '生物', '历史', '地理', '政治', '编程', '美术', '音乐']
const contentTemplateStorageKey = 'youzuobiao.teacher-content-templates'
const focusIconComponents = { monitor:Monitor, trend:TrendCharts, flag:Flag, setting:Setting, reading:Reading, collection:Collection, calendar:Calendar, timer:Timer, notebook:Notebook, trophy:Trophy, aim:Aim } satisfies Record<BuiltInFocusIcon, Component>
function isBuiltInFocusIcon(icon: string): icon is BuiltInFocusIcon { return icon in focusIconComponents }
function isUploadedFocusIcon(icon: string): boolean { return icon.startsWith('data:image/') }
function focusIconComponent(icon: string): Component { return focusIconComponents[isBuiltInFocusIcon(icon) ? icon : 'aim'] }
const defaultContentTemplates: ContentTemplateSettings = {
  intros: [
    { id:'intro-responsible', title:'认真负责型', content:'我是一名认真负责、耐心细致的老师，重视与学生及家长保持充分沟通。我会先了解孩子的学习基础和习惯，再制定阶段性学习目标，通过针对性练习帮助学生建立信心、稳步提升。', enabled:true, updatedAt:'2026-08-03 16:20' },
    { id:'intro-method', title:'方法引导型', content:'我擅长梳理知识结构和学习方法，善于将抽象知识拆解为易理解、可练习的步骤。课堂中会结合例题、错题和即时反馈，帮助学生找到薄弱环节，形成自主复盘与迁移应用的能力。', enabled:true, updatedAt:'2026-08-03 16:20' },
    { id:'intro-companion', title:'陪伴鼓励型', content:'我注重营造轻松、专注的学习氛围，愿意倾听学生的困惑，并用鼓励和清晰的反馈陪伴成长。希望通过稳定的课堂节奏与持续陪练，让学生逐渐从害怕学习转变为愿意主动尝试。', enabled:true, updatedAt:'2026-08-03 16:20' },
    { id:'intro-planning', title:'目标规划型', content:'我会根据学生的学习目标制定个性化学习计划：基础阶段夯实知识与习惯，提升阶段强化题型与方法，冲刺阶段侧重真题、错题和时间管理。每节课后均会给出可执行的复习建议。', enabled:true, updatedAt:'2026-08-03 16:20' }
  ],
  focusItems: [
    { id:'focus-foundation', icon:'monitor', title:'基础薄弱', subtitle:'课内知识不牢，基础题易失分' },
    { id:'focus-exam', icon:'trend', title:'中考提分', subtitle:'成绩进入瓶颈期，需要查漏补缺' },
    { id:'focus-gaokao', icon:'flag', title:'高考冲刺', subtitle:'聚焦高频考点，强化应试策略' },
    { id:'focus-thinking', icon:'setting', title:'数学思维提升', subtitle:'综合题、推理题容易卡住' },
    { id:'focus-reading', icon:'reading', title:'阅读理解提升', subtitle:'提炼信息困难，答题缺少方法' },
    { id:'focus-vocabulary', icon:'collection', title:'英语词汇积累', subtitle:'词汇基础薄弱，影响阅读表达' },
    { id:'focus-habit', icon:'calendar', title:'学习习惯养成', subtitle:'计划执行不稳，需要持续引导' },
    { id:'focus-efficiency', icon:'timer', title:'作业效率提升', subtitle:'完成速度偏慢，时间分配不合理' },
    { id:'focus-review', icon:'notebook', title:'错题整理方法', subtitle:'重复失分，需要建立复盘体系' },
    { id:'focus-competition', icon:'trophy', title:'竞赛启蒙', subtitle:'培养兴趣，拓展进阶思维' }
  ],
  achievements: [
    { id:'achievement-score', icon:'trend', title:'中考数学从 72 分 → 110 分', subtitle:'初三学生 · 李同学', highlight:'提升 38 分', enabled:true },
    { id:'achievement-rank', icon:'flag', title:'期中考从班级 45 名 → 12 名', subtitle:'基础薄弱 · 张同学', highlight:'提升 33 名', enabled:true },
    { id:'achievement-geometry', icon:'trend', title:'几何模块专项突破，稳定 135+', subtitle:'思维提升 · 王同学', highlight:'（满分 150）', enabled:true }
  ]
}
function normalizeFocusItems(value: unknown): TeachingFocusItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item, index) => {
    if (typeof item === 'string') {
      const matched = defaultContentTemplates.focusItems.find(option => option.title === item)
      return [matched ? { ...matched } : { id:`focus-legacy-${index}`, icon:'aim', title:item, subtitle:'面向学生需求的专项教学方向' }]
    }
    if (!item || typeof item !== 'object') return []
    const candidate = item as Partial<TeachingFocusItem>
    if (!candidate.title) return []
    const icon = typeof candidate.icon === 'string' && (isBuiltInFocusIcon(candidate.icon) || isUploadedFocusIcon(candidate.icon)) ? candidate.icon : 'monitor'
    return [{ id:candidate.id || `focus-${index}-${Date.now()}`, icon, title:candidate.title, subtitle:candidate.subtitle || '面向学生需求的专项教学方向' }]
  })
}
function loadContentTemplates(): ContentTemplateSettings {
  const raw = window.localStorage.getItem(contentTemplateStorageKey)
  if (!raw) return { intros: defaultContentTemplates.intros.map(item => ({ ...item })), focusItems: defaultContentTemplates.focusItems.map(item => ({ ...item })), achievements: defaultContentTemplates.achievements.map(item => ({ ...item })) }
  try {
    const parsed = JSON.parse(raw) as StoredContentTemplateSettings
    const focusItems = normalizeFocusItems(parsed.focusItems ?? parsed.focusTags)
    if (!Array.isArray(parsed.intros) || !focusItems.length) throw new Error('invalid content template settings')
    const achievements = Array.isArray(parsed.achievements) && parsed.achievements.length
      ? parsed.achievements.map(item => ({ ...item }))
      : defaultContentTemplates.achievements.map(item => ({ ...item }))
    return { intros: parsed.intros.map(item => ({ ...item })), focusItems, achievements }
  } catch {
    return { intros: defaultContentTemplates.intros.map(item => ({ ...item })), focusItems: defaultContentTemplates.focusItems.map(item => ({ ...item })), achievements: defaultContentTemplates.achievements.map(item => ({ ...item })) }
  }
}
const initialContentTemplates = loadContentTemplates()
const introTemplates = ref<IntroTemplate[]>(initialContentTemplates.intros)
const teachingFocusOptions = ref<TeachingFocusItem[]>(initialContentTemplates.focusItems)
const teachingAchievements = ref<TeachingAchievementItem[]>(initialContentTemplates.achievements)
const activeIntroTemplates = computed(() => introTemplates.value.filter(item => item.enabled))
const teachingFocus = ref<string[]>(['中考提分', '数学思维提升'])
const maxTeachingFocusCount = 3
function isTeachingFocusOptionDisabled(title: string): boolean {
  return teachingFocus.value.length >= maxTeachingFocusCount && !teachingFocus.value.includes(title)
}
function limitTeachingFocusSelection(): void {
  if (teachingFocus.value.length <= maxTeachingFocusCount) return
  teachingFocus.value = teachingFocus.value.slice(0, maxTeachingFocusCount)
  ElMessage.warning('教学侧重最多选择 3 项')
}
const contentManagementTab = ref<'intros' | 'focus' | 'tags' | 'types' | 'achievements'>('types')
const newTemplateRowId = '__new-intro-template__'
const editingTemplateId = ref<string | null>(null)
const templateSaving = ref(false)
const inlineTemplateDraft = reactive({ id:'', title:'', content:'', enabled:true })
const templateTableRows = computed<IntroTemplate[]>(() => editingTemplateId.value === newTemplateRowId
  ? [...introTemplates.value, { id:newTemplateRowId, title:'', content:'', enabled:true, updatedAt:'-' }]
  : introTemplates.value)
const newFocusRowId = '__new-teaching-focus__'
const editingFocusId = ref<string | null>(null)
const focusSaving = ref(false)
const inlineFocusDraft = reactive<TeachingFocusItem>({ id:'', icon:'', title:'', subtitle:'' })
const focusTableRows = computed<TeachingFocusItem[]>(() => editingFocusId.value === newFocusRowId
  ? [...teachingFocusOptions.value, { id:newFocusRowId, icon:'', title:'', subtitle:'' }]
  : teachingFocusOptions.value)
const newAchievementRowId = '__new-teaching-achievement__'
const editingAchievementId = ref<string | null>(null)
const achievementSaving = ref(false)
const inlineAchievementDraft = reactive<TeachingAchievementItem>({ id:'', icon:'', title:'', subtitle:'', highlight:'', enabled:true })
const achievementTableRows = computed<TeachingAchievementItem[]>(() => editingAchievementId.value === newAchievementRowId
  ? [...teachingAchievements.value, { id:newAchievementRowId, icon:'', title:'', subtitle:'', highlight:'', enabled:true }]
  : teachingAchievements.value)
const teacherTagStorageKey = 'youzuobiao.teacher-tags'
const defaultTeacherTags: TeacherTag[] = [
  { id:'tag-excellent', name:'优秀教师', enabled:true, source:'超级主管/admin', sort:100, updatedAt:'2026-07-31 10:17:00' },
  { id:'tag-cet', name:'四六级', enabled:true, source:'超级主管/admin', sort:100, updatedAt:'2026-07-17 17:03:58' },
  { id:'tag-tem8', name:'专八已过', enabled:true, source:'超级主管/admin', sort:100, updatedAt:'2026-07-17 17:03:58' },
  { id:'tag-zero-complaint', name:'零投诉', enabled:true, source:'超级主管/admin', sort:100, updatedAt:'2026-08-03 13:46:30' },
  { id:'tag-elite-school', name:'985/211', enabled:true, source:'超级主管/admin', sort:88, updatedAt:'2026-07-31 10:17:00' },
  { id:'tag-senior', name:'高级教师', enabled:true, source:'超级主管/admin', sort:66, updatedAt:'2026-07-30 21:44:40' },
  { id:'tag-competition', name:'竞赛导师', enabled:true, source:'超级主管/admin', sort:10, updatedAt:'2026-07-31 10:17:00' },
  { id:'tag-famous-school', name:'培育名校学子', enabled:false, source:'超级主管/admin', sort:0, updatedAt:'2026-07-17 17:03:58' }
]
function loadTeacherTags(): TeacherTag[] {
  const raw = window.localStorage.getItem(teacherTagStorageKey)
  if (!raw) return defaultTeacherTags.map(item => ({ ...item }))
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) throw new Error('invalid teacher tags')
    const tags = parsed.filter((item): item is TeacherTag => Boolean(item && typeof item === 'object' && 'id' in item && 'name' in item && 'enabled' in item && 'source' in item && 'sort' in item && 'updatedAt' in item))
    return tags.length ? tags.map(item => ({ ...item })) : defaultTeacherTags.map(item => ({ ...item }))
  } catch {
    return defaultTeacherTags.map(item => ({ ...item }))
  }
}
const teacherTags = ref<TeacherTag[]>(loadTeacherTags())
const enabledTeacherTags = computed(() => teacherTags.value.filter(item => item.enabled).sort((a, b) => b.sort - a.sort))
const teacherTagPage = ref(1)
const teacherTagPageSize = ref(10)
const newTeacherTagRowId = '__new-teacher-tag__'
const editingTeacherTagId = ref<string | null>(null)
const teacherTagSaving = ref(false)
const teacherTagDraft = reactive<TeacherTagDraft>({ id:'', name:'', enabled:true, sort:100 })
const filteredTeacherTags = computed(() => [...teacherTags.value]
  .sort((a, b) => b.sort - a.sort || b.updatedAt.localeCompare(a.updatedAt)))
const teacherTagPageRows = computed(() => {
  const start = (teacherTagPage.value - 1) * teacherTagPageSize.value
  return filteredTeacherTags.value.slice(start, start + teacherTagPageSize.value)
})
const teacherTagTableRows = computed<TeacherTag[]>(() => editingTeacherTagId.value === newTeacherTagRowId
  ? [...teacherTagPageRows.value, { id:newTeacherTagRowId, name:'', enabled:true, source:'超级主管/admin', sort:100, updatedAt:'-' }]
  : teacherTagPageRows.value)
function persistTeacherTags(): void { window.localStorage.setItem(teacherTagStorageKey, JSON.stringify(teacherTags.value)) }
function teacherTagUsage(name: string): number { return rows.value.filter(teacher => teacher.tags.includes(name)).length }
function teacherTagIndex(index: number): number { return (teacherTagPage.value - 1) * teacherTagPageSize.value + index + 1 }
function currentDateTime(): string {
  const now = new Date()
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}
function ensureTeacherTagEditorAvailable(): boolean {
  if (editingTeacherTagId.value) {
    ElMessage.warning('请先保存或取消当前教师标签编辑')
    return false
  }
  return true
}
function startTeacherTagEdit(tag: TeacherTag): void {
  if (!ensureTeacherTagEditorAvailable()) return
  Object.assign(teacherTagDraft, { id:tag.id, name:tag.name, enabled:tag.enabled, sort:tag.sort })
  editingTeacherTagId.value = tag.id
}
function startNewTeacherTag(): void {
  if (!ensureTeacherTagEditorAvailable()) return
  Object.assign(teacherTagDraft, { id:'', name:'', enabled:true, sort:100 })
  editingTeacherTagId.value = newTeacherTagRowId
}
function cancelTeacherTagEdit(): void {
  editingTeacherTagId.value = null
  Object.assign(teacherTagDraft, { id:'', name:'', enabled:true, sort:100 })
}
function teacherTagRowClassName({ row }: { row: TeacherTag }): string {
  return editingTeacherTagId.value === row.id ? 'template-editing-row' : ''
}
async function saveTeacherTag(): Promise<void> {
  if (teacherTagSaving.value) return
  const name = teacherTagDraft.name.trim()
  if (!name) { ElMessage.warning('请输入标签名称'); return }
  if (name.length < 2 || name.length > 20) { ElMessage.warning('标签名称长度为 2 至 20 个字符'); return }
  if (!Number.isInteger(teacherTagDraft.sort) || teacherTagDraft.sort < 0 || teacherTagDraft.sort > 999) { ElMessage.warning('排序必须为 0 至 999 的整数'); return }
  if (teacherTags.value.some(item => item.name === name && item.id !== teacherTagDraft.id)) { ElMessage.warning('标签名称已存在'); return }
  const editingExistingTag = Boolean(teacherTagDraft.id)
  teacherTagSaving.value = true
  await new Promise<void>(resolve => window.setTimeout(resolve, 350))
  const updatedAt = currentDateTime()
  if (teacherTagDraft.id) {
    const index = teacherTags.value.findIndex(item => item.id === teacherTagDraft.id)
    if (index >= 0) {
      const previousName = teacherTags.value[index].name
      teacherTags.value[index] = { ...teacherTags.value[index], name, enabled:teacherTagDraft.enabled, sort:teacherTagDraft.sort, updatedAt }
      if (previousName !== name) rows.value.forEach(teacher => { teacher.tags = teacher.tags.map(value => value === previousName ? name : value) })
    }
  } else {
    teacherTags.value.push({ id:`tag-${Date.now()}`, name, enabled:teacherTagDraft.enabled, source:'超级主管/admin', sort:teacherTagDraft.sort, updatedAt })
  }
  persistTeacherTags()
  teacherTagSaving.value = false
  cancelTeacherTagEdit()
  ElMessage.success(editingExistingTag ? '教师标签已更新' : '教师标签已新增')
}
function updateTeacherTagStatus(tag: TeacherTag): void {
  persistTeacherTags()
  ElMessage.success(tag.enabled ? '教师标签已启用' : '教师标签已停用')
}
async function deleteTeacherTag(tag: TeacherTag): Promise<void> {
  const usage = teacherTagUsage(tag.name)
  try {
    await ElMessageBox.confirm(usage ? `该标签已关联 ${usage} 位教师，删除后将同步解除关联，确定删除吗？` : `确定删除教师标签“${tag.name}”吗？`, '删除教师标签', { type:'warning', confirmButtonText:'删除', cancelButtonText:'取消' })
  } catch { return }
  teacherTags.value = teacherTags.value.filter(item => item.id !== tag.id)
  rows.value.forEach(teacher => { teacher.tags = teacher.tags.filter(value => value !== tag.name) })
  current.value.tags = current.value.tags.filter(value => value !== tag.name)
  const maxPage = Math.max(1, Math.ceil(filteredTeacherTags.value.length / teacherTagPageSize.value))
  teacherTagPage.value = Math.min(teacherTagPage.value, maxPage)
  persistTeacherTags()
  ElMessage.success('教师标签已删除')
}
const teacherTypeStorageKey = 'youzuobiao.teacher-types'
const defaultTeacherTypes: TeacherTypeItem[] = [
  { id:'type-good', name:'好老师', sort:100, enabled:true },
  { id:'type-excellent', name:'优秀教师', sort:90, enabled:true },
  { id:'type-math', name:'数学专家', sort:80, enabled:true },
  { id:'type-english', name:'英语专家', sort:70, enabled:false },
  { id:'type-core', name:'骨干教员', sort:60, enabled:true },
  { id:'type-professional', name:'专业教员', sort:50, enabled:true }
]
function loadTeacherTypes(): TeacherTypeItem[] {
  const raw = window.localStorage.getItem(teacherTypeStorageKey)
  if (!raw) return defaultTeacherTypes.map(item => ({ ...item }))
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) throw new Error('invalid teacher types')
    const types = parsed.flatMap((item): TeacherTypeItem[] => {
      if (!item || typeof item !== 'object') return []
      const candidate = item as Partial<TeacherTypeItem> & { parentType?: unknown }
      const name = typeof candidate.name === 'string' ? candidate.name : typeof candidate.parentType === 'string' ? candidate.parentType : ''
      if (!name || typeof candidate.id !== 'string' || typeof candidate.sort !== 'number' || typeof candidate.enabled !== 'boolean') return []
      return [{ id:candidate.id, name, sort:candidate.sort, enabled:candidate.enabled }]
    })
    return types.length ? types : defaultTeacherTypes.map(item => ({ ...item }))
  } catch {
    return defaultTeacherTypes.map(item => ({ ...item }))
  }
}
const teacherTypes = ref<TeacherTypeItem[]>(loadTeacherTypes())
const enabledTeacherTypes = computed(() => teacherTypes.value
  .filter(item => item.enabled)
  .map(item => ({ ...item, parentType:item.name }))
  .sort((a, b) => b.sort - a.sort))
const teacherTypePage = ref(1)
const teacherTypePageSize = ref(10)
const newTeacherTypeRowId = '__new-teacher-type__'
const editingTeacherTypeId = ref<string | null>(null)
const teacherTypeSaving = ref(false)
const teacherTypeDraft = reactive<TeacherTypeDraft>({ id:'', name:'', sort:100, enabled:true })
const filteredTeacherTypes = computed(() => [...teacherTypes.value]
  .sort((a, b) => b.sort - a.sort || a.name.localeCompare(b.name, 'zh-CN')))
const teacherTypePageRows = computed(() => {
  const start = (teacherTypePage.value - 1) * teacherTypePageSize.value
  return filteredTeacherTypes.value.slice(start, start + teacherTypePageSize.value)
})
const teacherTypeTableRows = computed<TeacherTypeItem[]>(() => editingTeacherTypeId.value === newTeacherTypeRowId
  ? [...teacherTypePageRows.value, { id:newTeacherTypeRowId, name:'', sort:100, enabled:true }]
  : teacherTypePageRows.value)
function persistTeacherTypes(): void { window.localStorage.setItem(teacherTypeStorageKey, JSON.stringify(teacherTypes.value)) }
function teacherTypeIndex(index: number): number { return (teacherTypePage.value - 1) * teacherTypePageSize.value + index + 1 }
function ensureTeacherTypeEditorAvailable(): boolean {
  if (editingTeacherTypeId.value) {
    ElMessage.warning('请先保存或取消当前教师类型编辑')
    return false
  }
  return true
}
function startTeacherTypeEdit(item: TeacherTypeItem): void {
  if (!ensureTeacherTypeEditorAvailable()) return
  Object.assign(teacherTypeDraft, { id:item.id, name:item.name, sort:item.sort, enabled:item.enabled })
  editingTeacherTypeId.value = item.id
}
function startNewTeacherType(): void {
  if (!ensureTeacherTypeEditorAvailable()) return
  Object.assign(teacherTypeDraft, { id:'', name:'', sort:100, enabled:true })
  editingTeacherTypeId.value = newTeacherTypeRowId
}
function cancelTeacherTypeEdit(): void {
  editingTeacherTypeId.value = null
  Object.assign(teacherTypeDraft, { id:'', name:'', sort:100, enabled:true })
}
function teacherTypeRowClassName({ row }: { row: TeacherTypeItem }): string {
  return editingTeacherTypeId.value === row.id ? 'template-editing-row' : ''
}
async function saveTeacherType(): Promise<void> {
  if (teacherTypeSaving.value) return
  const name = teacherTypeDraft.name.trim()
  if (!name) { ElMessage.warning('请输入教师类型'); return }
  if (name.length < 2 || name.length > 20) { ElMessage.warning('教师类型长度为 2 至 20 个字符'); return }
  if (!Number.isInteger(teacherTypeDraft.sort) || teacherTypeDraft.sort < 0 || teacherTypeDraft.sort > 999) { ElMessage.warning('排序必须为 0 至 999 的整数'); return }
  if (teacherTypes.value.some(item => item.name === name && item.id !== teacherTypeDraft.id)) {
    ElMessage.warning('相同教师类型已存在')
    return
  }
  const editingExistingType = Boolean(teacherTypeDraft.id)
  teacherTypeSaving.value = true
  await new Promise<void>(resolve => window.setTimeout(resolve, 350))
  if (teacherTypeDraft.id) {
    const index = teacherTypes.value.findIndex(item => item.id === teacherTypeDraft.id)
    if (index >= 0) {
      const previousName = teacherTypes.value[index].name
      teacherTypes.value[index] = { id:teacherTypeDraft.id, name, sort:teacherTypeDraft.sort, enabled:teacherTypeDraft.enabled }
      if (previousName !== name) {
        rows.value.forEach(teacher => { if (teacher.type === previousName) teacher.type = name })
        if (current.value.type === previousName) current.value.type = name
      }
    }
  } else {
    teacherTypes.value.push({ id:`type-${Date.now()}`, name, sort:teacherTypeDraft.sort, enabled:teacherTypeDraft.enabled })
  }
  persistTeacherTypes()
  teacherTypeSaving.value = false
  cancelTeacherTypeEdit()
  ElMessage.success(editingExistingType ? '教师类型已更新' : '教师类型已新增')
}
function updateTeacherTypeStatus(item: TeacherTypeItem): void {
  persistTeacherTypes()
  ElMessage.success(item.enabled ? '教师类型已启用' : '教师类型已停用')
}
async function deleteTeacherType(item: TeacherTypeItem): Promise<void> {
  const usage = rows.value.filter(teacher => teacher.type === item.name).length
  try {
    await ElMessageBox.confirm(usage ? `该类型已关联 ${usage} 位教师，删除后已保存资料仍保留原类型，但无法再次选择。确定删除吗？` : `确定删除教师类型“${item.name}”吗？`, '删除教师类型', { type:'warning', confirmButtonText:'删除', cancelButtonText:'取消' })
  } catch { return }
  teacherTypes.value = teacherTypes.value.filter(type => type.id !== item.id)
  const maxPage = Math.max(1, Math.ceil(filteredTeacherTypes.value.length / teacherTypePageSize.value))
  teacherTypePage.value = Math.min(teacherTypePage.value, maxPage)
  persistTeacherTypes()
  ElMessage.success('教师类型已删除')
}
const isPrimaryOnly = computed(() => current.value.grades.length === 1 && current.value.grades[0] === '小学')
const portraitGenerating = ref(false)
const defaultOriginalPortraitUrl = 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=480&q=85'
const defaultAiPortraitUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=480&q=85'
const originalPortraitUrl = ref(defaultOriginalPortraitUrl)
const aiPortraitUrl = ref(defaultAiPortraitUrl)
function isSubjectDisabled(subject: string): boolean {
  return isPrimaryOnly.value && !primarySubjects.includes(subject)
}
function handleGradesChange(): void {
  if (isPrimaryOnly.value) {
    current.value.subjects = current.value.subjects.filter(subject => primarySubjects.includes(subject))
  }
}
function setPortraitUrls(teacher: Teacher): void {
  originalPortraitUrl.value = teacher.originalPortraitUrl || defaultOriginalPortraitUrl
  aiPortraitUrl.value = teacher.aiPortraitUrl || defaultAiPortraitUrl
}
function startPortraitGeneration(file: UploadFile): void {
  if (!file.raw) return
  if (!file.raw.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件')
    return
  }
  if (file.raw.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 10MB')
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result !== 'string') return
    originalPortraitUrl.value = reader.result
    current.value.originalPortraitUrl = reader.result
    portraitGenerating.value = true
    window.setTimeout(() => {
      // 原型阶段以本地上传图模拟 AI 成片，接入服务后替换为生成结果 URL。
      aiPortraitUrl.value = reader.result as string
      current.value.aiPortraitUrl = aiPortraitUrl.value
      portraitGenerating.value = false
      ElMessage.success('AI 形象照已生成')
    }, 1800)
  }
  reader.readAsDataURL(file.raw)
}
const drawer = ref(false); const active = ref<'base'|'display'>('base'); const current = ref<Teacher>(cloneTeacher(rows.value[0])); const saving = ref(false); const page = ref(1); const editing = ref(false); const auditDialog = ref(false); const auditDecision = ref<AuditStatus>('审核通过'); const auditNote = ref('')
function isSharedApplication(value: unknown): value is SharedTeacherApplication {
  if (!value || typeof value !== 'object') return false
  return 'id' in value && typeof value.id === 'string' && 'name' in value && typeof value.name === 'string' && 'subjects' in value && Array.isArray(value.subjects) && 'grades' in value && Array.isArray(value.grades) && 'submittedAt' in value && typeof value.submittedAt === 'string'
}
function maskPhone(phone: string): string {
  return /^1\d{10}$/.test(phone) ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone || '-'
}
function hydrateSubmittedApplication(): void {
  const raw = window.localStorage.getItem('youzuobiao.teacher-onboarding.latest')
  if (!raw) return
  const parsed: unknown = JSON.parse(raw)
  if (!isSharedApplication(parsed) || rows.value.some(row => row.id === parsed.id)) return
  const date = new Date(parsed.submittedAt)
  rows.value.unshift({
    id: parsed.id,
    name: parsed.name,
    initials: parsed.name.slice(0, 1) || '师',
    level: '普通讲师',
    type: parsed.teacherType === '在校生' ? '兼职教员' : '专业教员',
    phone: maskPhone(parsed.phone),
    wechat: '-',
    subjects: parsed.subjects.length ? [...parsed.subjects] : ['待补充'],
    grades: parsed.grades.length ? [...parsed.grades] : ['待补充'],
    tags: [],
    hours: 0,
    rating: 0,
    status: '未授课',
    online: false,
    auditStatus: '待审核',
    date: Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false }),
    city: '-',
    school: parsed.school || '-',
    education: parsed.education || '待补充',
    experience: normalizeTeachingExperience(parsed.experience ?? parsed.experienceRange),
    intro: parsed.intro || '暂未填写个人简介。'
  })
}
function handleStorage(event: StorageEvent): void {
  if (event.key === 'youzuobiao.teacher-onboarding.latest') hydrateSubmittedApplication()
  if (event.key === contentTemplateStorageKey) {
    const settings = loadContentTemplates()
    introTemplates.value = settings.intros
    teachingFocusOptions.value = settings.focusItems
    teachingAchievements.value = settings.achievements
  }
  if (event.key === teacherTagStorageKey) teacherTags.value = loadTeacherTags()
  if (event.key === teacherTypeStorageKey) teacherTypes.value = loadTeacherTypes()
}
onMounted(() => { hydrateSubmittedApplication(); window.addEventListener('storage', handleStorage) })
onBeforeUnmount(() => window.removeEventListener('storage', handleStorage))
function persistContentTemplates(): void {
  const settings: ContentTemplateSettings = { intros: introTemplates.value, focusItems: teachingFocusOptions.value, achievements: teachingAchievements.value }
  window.localStorage.setItem(contentTemplateStorageKey, JSON.stringify(settings))
}
function ensureTemplateEditorAvailable(): boolean {
  if (editingTemplateId.value) {
    ElMessage.warning('请先保存或取消当前编辑')
    return false
  }
  return true
}
function startInlineTemplateEdit(template: IntroTemplate): void {
  if (!ensureTemplateEditorAvailable()) return
  Object.assign(inlineTemplateDraft, template)
  editingTemplateId.value = template.id
}
function startNewInlineTemplate(): void {
  if (!ensureTemplateEditorAvailable()) return
  Object.assign(inlineTemplateDraft, { id:'', title:'', content:'', enabled:true })
  editingTemplateId.value = newTemplateRowId
}
function cancelInlineTemplateEdit(): void {
  editingTemplateId.value = null
  Object.assign(inlineTemplateDraft, { id:'', title:'', content:'', enabled:true })
}
function templateRowClassName({ row }: { row: IntroTemplate }): string {
  return editingTemplateId.value === row.id ? 'template-editing-row' : ''
}
async function saveInlineTemplate(): Promise<void> {
  const title = inlineTemplateDraft.title.trim()
  const content = inlineTemplateDraft.content.trim()
  if (!title) { ElMessage.warning('请输入模板名称'); return }
  if (!content) { ElMessage.warning('请输入模板内容'); return }
  if (introTemplates.value.some(item => item.title === title && item.id !== inlineTemplateDraft.id)) { ElMessage.warning('模板名称已存在'); return }
  templateSaving.value = true
  await new Promise<void>(resolve => window.setTimeout(resolve, 350))
  const updatedAt = new Date().toLocaleString('zh-CN', { hour12:false })
  if (inlineTemplateDraft.id) {
    const index = introTemplates.value.findIndex(item => item.id === inlineTemplateDraft.id)
    if (index >= 0) introTemplates.value[index] = { id:inlineTemplateDraft.id, title, content, enabled:inlineTemplateDraft.enabled, updatedAt }
  } else {
    introTemplates.value.push({ id:`intro-${Date.now()}`, title, content, enabled:inlineTemplateDraft.enabled, updatedAt })
  }
  persistContentTemplates()
  templateSaving.value = false
  cancelInlineTemplateEdit()
  ElMessage.success('个人简介模板已保存')
}
async function deleteIntroTemplate(template: IntroTemplate): Promise<void> {
  if (template.enabled && activeIntroTemplates.value.length <= 1) { ElMessage.warning('至少保留一个启用的个人简介模板'); return }
  try {
    await ElMessageBox.confirm(`删除后教师入驻和教师详情将不再显示“${template.title}”，确定删除吗？`, '删除模板', { type:'warning', confirmButtonText:'删除', cancelButtonText:'取消' })
  } catch { return }
  introTemplates.value = introTemplates.value.filter(item => item.id !== template.id)
  persistContentTemplates()
  ElMessage.success('模板已删除')
}
function updateIntroTemplateStatus(template: IntroTemplate): void {
  if (!template.enabled && activeIntroTemplates.value.length === 0) {
    template.enabled = true
    ElMessage.warning('至少保留一个启用的个人简介模板')
    return
  }
  persistContentTemplates()
  ElMessage.success('模板状态已更新')
}
function ensureFocusEditorAvailable(): boolean {
  if (editingFocusId.value) {
    ElMessage.warning('请先保存或取消当前教学侧重编辑')
    return false
  }
  return true
}
function startFocusEdit(item: TeachingFocusItem): void {
  if (!ensureFocusEditorAvailable()) return
  Object.assign(inlineFocusDraft, item)
  editingFocusId.value = item.id
}
function startNewFocus(): void {
  if (!ensureFocusEditorAvailable()) return
  Object.assign(inlineFocusDraft, { id:'', icon:'', title:'', subtitle:'' })
  editingFocusId.value = newFocusRowId
}
function cancelFocusEdit(): void {
  editingFocusId.value = null
  Object.assign(inlineFocusDraft, { id:'', icon:'', title:'', subtitle:'' })
}
function focusRowClassName({ row }: { row: TeachingFocusItem }): string {
  return editingFocusId.value === row.id ? 'template-editing-row' : ''
}
function handleFocusIconUpload(file: UploadFile): void {
  const raw = file.raw
  if (!raw) return
  if (!raw.type.startsWith('image/')) { ElMessage.warning('请上传图片格式的图标'); return }
  if (raw.size > 200 * 1024) { ElMessage.warning('图标大小不能超过 200KB'); return }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') inlineFocusDraft.icon = reader.result
  }
  reader.onerror = () => ElMessage.error('图标读取失败，请重新上传')
  reader.readAsDataURL(raw)
}
async function saveFocusItem(): Promise<void> {
  const title = inlineFocusDraft.title.trim()
  const subtitle = inlineFocusDraft.subtitle.trim()
  if (!inlineFocusDraft.icon) { ElMessage.warning('请上传教学侧重图标'); return }
  if (!title) { ElMessage.warning('请输入教学侧重标题'); return }
  if (!subtitle) { ElMessage.warning('请输入教学侧重副标题'); return }
  if (teachingFocusOptions.value.some(item => item.title === title && item.id !== inlineFocusDraft.id)) { ElMessage.warning('教学侧重标题已存在'); return }
  focusSaving.value = true
  await new Promise<void>(resolve => window.setTimeout(resolve, 300))
  if (inlineFocusDraft.id) {
    const index = teachingFocusOptions.value.findIndex(item => item.id === inlineFocusDraft.id)
    if (index >= 0) {
      const previousTitle = teachingFocusOptions.value[index].title
      teachingFocusOptions.value[index] = { id:inlineFocusDraft.id, icon:inlineFocusDraft.icon, title, subtitle }
      teachingFocus.value = teachingFocus.value.map(value => value === previousTitle ? title : value)
    }
  } else {
    teachingFocusOptions.value.push({ id:`focus-${Date.now()}`, icon:inlineFocusDraft.icon, title, subtitle })
  }
  persistContentTemplates()
  focusSaving.value = false
  cancelFocusEdit()
  ElMessage.success('教学侧重已保存')
}
async function removeFocusItem(item: TeachingFocusItem): Promise<void> {
  if (teachingFocusOptions.value.length <= 1) { ElMessage.warning('至少保留一个教学侧重'); return }
  try {
    await ElMessageBox.confirm(`确定删除教学侧重“${item.title}”吗？`, '删除教学侧重', { type:'warning', confirmButtonText:'删除', cancelButtonText:'取消' })
  } catch { return }
  teachingFocusOptions.value = teachingFocusOptions.value.filter(option => option.id !== item.id)
  teachingFocus.value = teachingFocus.value.filter(value => value !== item.title)
  persistContentTemplates()
  ElMessage.success('教学侧重已删除')
}
function ensureAchievementEditorAvailable(): boolean {
  if (editingAchievementId.value) {
    ElMessage.warning('请先保存或取消当前教学成果编辑')
    return false
  }
  return true
}
function startAchievementEdit(item: TeachingAchievementItem): void {
  if (!ensureAchievementEditorAvailable()) return
  Object.assign(inlineAchievementDraft, item)
  editingAchievementId.value = item.id
}
function startNewAchievement(): void {
  if (!ensureAchievementEditorAvailable()) return
  Object.assign(inlineAchievementDraft, { id:'', icon:'', title:'', subtitle:'', highlight:'', enabled:true })
  editingAchievementId.value = newAchievementRowId
}
function cancelAchievementEdit(): void {
  editingAchievementId.value = null
  Object.assign(inlineAchievementDraft, { id:'', icon:'', title:'', subtitle:'', highlight:'', enabled:true })
}
function achievementRowClassName({ row }: { row: TeachingAchievementItem }): string {
  return editingAchievementId.value === row.id ? 'template-editing-row' : ''
}
function handleAchievementIconUpload(file: UploadFile): void {
  const raw = file.raw
  if (!raw) return
  if (!raw.type.startsWith('image/')) { ElMessage.warning('请上传图片格式的图标'); return }
  if (raw.size > 200 * 1024) { ElMessage.warning('图标大小不能超过 200KB'); return }
  const reader = new FileReader()
  reader.onload = () => {
    if (typeof reader.result === 'string') inlineAchievementDraft.icon = reader.result
  }
  reader.onerror = () => ElMessage.error('图标读取失败，请重新上传')
  reader.readAsDataURL(raw)
}
async function saveAchievementItem(): Promise<void> {
  const title = inlineAchievementDraft.title.trim()
  const subtitle = inlineAchievementDraft.subtitle.trim()
  const highlight = inlineAchievementDraft.highlight.trim()
  if (!inlineAchievementDraft.icon) { ElMessage.warning('请上传教学成果图标'); return }
  if (!title) { ElMessage.warning('请输入教学成果主标题'); return }
  if (!subtitle) { ElMessage.warning('请输入教学成果副标题'); return }
  if (!highlight) { ElMessage.warning('请输入教学成果强化副标题'); return }
  if (teachingAchievements.value.some(item => item.title === title && item.id !== inlineAchievementDraft.id)) { ElMessage.warning('教学成果主标题已存在'); return }
  achievementSaving.value = true
  await new Promise<void>(resolve => window.setTimeout(resolve, 300))
  const nextItem: TeachingAchievementItem = { id:inlineAchievementDraft.id || `achievement-${Date.now()}`, icon:inlineAchievementDraft.icon, title, subtitle, highlight, enabled:inlineAchievementDraft.enabled }
  if (inlineAchievementDraft.id) {
    const index = teachingAchievements.value.findIndex(item => item.id === inlineAchievementDraft.id)
    if (index >= 0) teachingAchievements.value[index] = nextItem
  } else {
    teachingAchievements.value.push(nextItem)
  }
  persistContentTemplates()
  achievementSaving.value = false
  cancelAchievementEdit()
  ElMessage.success('教学成果已保存')
}
function updateAchievementStatus(): void {
  persistContentTemplates()
  ElMessage.success('教学成果状态已更新')
}
function open(row:Teacher, display=false, edit=false):void { current.value=cloneTeacher(row); setPortraitUrls(current.value); active.value=display?'display':'base'; editing.value=edit; drawer.value=true }
function beginTeacherEdit():void { editing.value=true }
function cancelTeacherEdit():void {
  const source = rows.value.find(row => row.id === current.value.id)
  if (source) current.value = cloneTeacher(source)
  setPortraitUrls(current.value)
  portraitGenerating.value = false
  editing.value = false
}
function reset():void { queryRef.value?.resetFields() }
function refresh():void { hydrateSubmittedApplication(); ElMessage.success('列表已刷新') }
function add():void { ElMessage.info('已打开新增教师流程') }
function goToOnboarding():void { window.location.href='../teacher-onboarding/' }
async function save():Promise<void>{saving.value=true; await new Promise<void>(r=>window.setTimeout(r,450)); const index=rows.value.findIndex(row=>row.id===current.value.id);if(index>=0)rows.value[index]=cloneTeacher(current.value);saving.value=false;drawer.value=false;ElMessage.success('教师资料已保存')}
async function submitAudit():Promise<void>{if(auditDecision.value==='已驳回'&&!auditNote.value.trim()){ElMessage.warning('请填写驳回原因');return};saving.value=true;await new Promise<void>(r=>window.setTimeout(r,450));current.value.auditStatus=auditDecision.value;const index=rows.value.findIndex(row=>row.id===current.value.id);if(index>=0)rows.value[index]=cloneTeacher(current.value);saving.value=false;auditDialog.value=false;drawer.value=false;auditNote.value='';ElMessage.success(auditDecision.value==='审核通过'?'审核已通过':'已驳回教师申请')}
</script>

<template>
<div class="screen" :class="{ 'is-embedded': embedded }">
  <aside class="side"><div class="brand"><span></span><b>优坐标管理系统</b></div><el-menu default-active="teacher" class="nav"><el-menu-item index="home"><Grid/>概览</el-menu-item><el-sub-menu index="resource"><template #title><Grid/>资源平台</template></el-sub-menu><el-sub-menu index="teach"><template #title><Menu/>教务管理</template><el-menu-item index="course">课程管理</el-menu-item><el-menu-item index="teacher">教师管理</el-menu-item><el-menu-item index="review">课程虚拟评价</el-menu-item><el-menu-item index="teacher-review">教师虚拟评价</el-menu-item><el-menu-item index="campus">校区管理</el-menu-item><el-menu-item index="report">课程表</el-menu-item><el-menu-item index="schedule">排课管理</el-menu-item></el-sub-menu><el-menu-item index="order"><Menu/>约单管理</el-menu-item><el-menu-item index="customer"><Grid/>客户管理</el-menu-item><el-menu-item index="im"><Grid/>IM</el-menu-item><el-menu-item index="finance"><Grid/>财务管理</el-menu-item><el-menu-item index="operate"><Grid/>运营管理</el-menu-item><el-menu-item index="share"><Grid/>分销管理</el-menu-item><el-menu-item index="system"><Setting/>系统管理</el-menu-item><el-menu-item index="platform"><Grid/>平台管理</el-menu-item><el-menu-item index="basic"><Grid/>基础设施</el-menu-item><el-menu-item index="pay"><Grid/>支付管理</el-menu-item><el-menu-item index="acn"><Grid/>ACN 管理</el-menu-item><el-menu-item index="ai"><Grid/>AI 大模型</el-menu-item></el-menu></aside>
  <section class="main"><header class="top"><el-icon><Menu/></el-icon><el-icon><Refresh/></el-icon><span>▣ 教务管理　›　{{ contentTemplatePage ? '教师内容管理' : '教师管理' }}</span><div class="top-right"><el-button link type="primary" :icon="SwitchButton" @click="goToOnboarding">教师端入驻</el-button><el-icon><Bell/></el-icon><el-avatar :size="28">管</el-avatar></div></header><div class="tabs"><span>▣ 分析页　×</span><span>✥ 用户团队　×</span><span>▣ 课程管理　×</span><b>● {{ contentTemplatePage ? '教师内容管理' : '教师管理' }}　×</b></div>
    <main v-if="contentTemplatePage" class="content template-management">
      <header class="template-page-head"><div><h1>教师内容管理</h1><p>统一管理教师入驻、教师详情和运营标记使用的标准内容。</p></div></header>
      <el-alert title="个人简介和教学侧重同步到教师入驻；教师标签和教师类型同步到管理端教师编辑；教学成果仅维护用户端展示案例，不进入入驻或教师资料。" type="info" :closable="false" show-icon/>
      <el-tabs v-model="contentManagementTab" class="content-management-tabs">
        <el-tab-pane label="教师类型" name="types">
          <section class="template-section teacher-type-section">
            <div class="template-section-head"><p>维护教师资料使用的运营分类，并同步到教师详情与编辑。</p><div class="template-section-actions"><span>共 {{ filteredTeacherTypes.length }} 条</span><el-button size="small" :icon="Plus" :disabled="editingTeacherTypeId !== null" @click="startNewTeacherType">新增教师类型</el-button></div></div>
            <el-table :data="teacherTypeTableRows" border stripe row-key="id" empty-text="暂无教师类型" :row-class-name="teacherTypeRowClassName">
              <el-table-column type="index" :index="teacherTypeIndex" label="序号" width="70" align="center"/>
              <el-table-column label="教师类型" min-width="180" show-overflow-tooltip><template #default="{row}"><el-input v-if="editingTeacherTypeId === row.id" v-model="teacherTypeDraft.name" maxlength="20" show-word-limit placeholder="请输入教师类型名称"/><span v-else>{{ row.name }}</span></template></el-table-column>
              <el-table-column label="排序" width="150" align="center" sortable><template #default="{row}"><el-input-number v-if="editingTeacherTypeId === row.id" v-model="teacherTypeDraft.sort" class="inline-config-number" :min="0" :max="999" :step="1" controls-position="right"/><span v-else>{{ row.sort }}</span></template></el-table-column>
              <el-table-column label="状态" width="100"><template #default="{row}"><el-switch v-if="editingTeacherTypeId === row.id" v-model="teacherTypeDraft.enabled" inline-prompt active-text="启用" inactive-text="停用"/><el-switch v-else v-model="row.enabled" inline-prompt active-text="启用" inactive-text="停用" :disabled="editingTeacherTypeId !== null" @change="updateTeacherTypeStatus(row)"/></template></el-table-column>
              <el-table-column label="操作" width="140" fixed="right"><template #default="{row}"><template v-if="editingTeacherTypeId === row.id"><el-button link @click="cancelTeacherTypeEdit">取消</el-button><el-button link type="primary" :loading="teacherTypeSaving" @click="saveTeacherType">保存</el-button></template><template v-else><el-button link type="primary" :disabled="editingTeacherTypeId !== null" @click="startTeacherTypeEdit(row)">编辑</el-button><el-button link type="danger" :disabled="editingTeacherTypeId !== null" @click="deleteTeacherType(row)">删除</el-button></template></template></el-table-column>
            </el-table>
            <div class="teacher-tag-pagebar"><span>共 {{ filteredTeacherTypes.length }} 条教师类型</span><el-pagination v-model:current-page="teacherTypePage" v-model:page-size="teacherTypePageSize" :total="filteredTeacherTypes.length" :page-sizes="[5,10,20]" layout="total, sizes, prev, pager, next, jumper" :disabled="editingTeacherTypeId !== null" @size-change="teacherTypePage=1"/></div>
          </section>
        </el-tab-pane>
        <el-tab-pane label="教师标签" name="tags">
          <section class="template-section teacher-tag-section">
            <div class="template-section-head"><p>维护教师身份、能力和运营特征标签，并同步到教师编辑。</p><div class="template-section-actions"><span>共 {{ filteredTeacherTags.length }} 条</span><el-button size="small" :icon="Plus" :disabled="editingTeacherTagId !== null" @click="startNewTeacherTag">新增教师标签</el-button></div></div>
            <el-table :data="teacherTagTableRows" border stripe row-key="id" empty-text="暂无教师标签" :row-class-name="teacherTagRowClassName">
              <el-table-column type="index" :index="teacherTagIndex" label="序号" width="70" align="center"/>
              <el-table-column label="标签名称" min-width="180" show-overflow-tooltip><template #default="{row}"><el-input v-if="editingTeacherTagId === row.id" v-model="teacherTagDraft.name" maxlength="20" show-word-limit placeholder="请输入标签名称"/><el-tag v-else effect="plain" disable-transitions>{{ row.name }}</el-tag></template></el-table-column>
              <el-table-column label="状态" width="100"><template #default="{row}"><el-switch v-if="editingTeacherTagId === row.id" v-model="teacherTagDraft.enabled" inline-prompt active-text="启用" inactive-text="停用"/><el-switch v-else v-model="row.enabled" inline-prompt active-text="启用" inactive-text="停用" :disabled="editingTeacherTagId !== null" @change="updateTeacherTagStatus(row)"/></template></el-table-column>
              <el-table-column label="排序" width="150" align="center" sortable><template #default="{row}"><el-input-number v-if="editingTeacherTagId === row.id" v-model="teacherTagDraft.sort" class="inline-config-number" :min="0" :max="999" :step="1" controls-position="right"/><span v-else>{{ row.sort }}</span></template></el-table-column>
              <el-table-column prop="updatedAt" label="更新时间" width="170"/>
              <el-table-column label="操作" width="140" fixed="right"><template #default="{row}"><template v-if="editingTeacherTagId === row.id"><el-button link @click="cancelTeacherTagEdit">取消</el-button><el-button link type="primary" :loading="teacherTagSaving" @click="saveTeacherTag">保存</el-button></template><template v-else><el-button link type="primary" :disabled="editingTeacherTagId !== null" @click="startTeacherTagEdit(row)">编辑</el-button><el-button link type="danger" :disabled="editingTeacherTagId !== null" @click="deleteTeacherTag(row)">删除</el-button></template></template></el-table-column>
            </el-table>
            <div class="teacher-tag-pagebar"><span>共 {{ filteredTeacherTags.length }} 条教师标签</span><el-pagination v-model:current-page="teacherTagPage" v-model:page-size="teacherTagPageSize" :total="filteredTeacherTags.length" :page-sizes="[5,10,20]" layout="total, sizes, prev, pager, next, jumper" :disabled="editingTeacherTagId !== null" @size-change="teacherTagPage=1"/></div>
          </section>
        </el-tab-pane>
        <el-tab-pane label="个人简介" name="intros">
      <section class="template-section"><div class="template-section-head"><p>供老师选择后带入简介，带入后仍可编辑。</p><div class="template-section-actions"><span>共 {{ introTemplates.length }} 条</span><el-button size="small" :icon="Plus" @click="startNewInlineTemplate">新增简介模板</el-button></div></div>
        <el-table :data="templateTableRows" border stripe row-key="id" empty-text="暂无个人简介模板" :row-class-name="templateRowClassName">
          <el-table-column label="模板名称" width="180"><template #default="{row}"><el-input v-if="editingTemplateId === row.id" v-model="inlineTemplateDraft.title" maxlength="20" placeholder="请输入模板名称"/><span v-else>{{ row.title }}</span></template></el-table-column>
          <el-table-column label="模板内容" min-width="360"><template #default="{row}"><el-input v-if="editingTemplateId === row.id" v-model="inlineTemplateDraft.content" class="inline-template-content" type="textarea" :autosize="{ minRows:2, maxRows:5 }" maxlength="300" show-word-limit placeholder="请输入模板内容"/><span v-else class="template-content-text">{{ row.content }}</span></template></el-table-column>
          <el-table-column prop="updatedAt" label="最近更新" width="160"/>
          <el-table-column label="状态" width="90"><template #default="{row}"><el-switch v-if="editingTemplateId === row.id" v-model="inlineTemplateDraft.enabled"/><el-switch v-else v-model="row.enabled" :disabled="editingTemplateId !== null" @change="updateIntroTemplateStatus(row)"/></template></el-table-column>
          <el-table-column label="操作" width="140" fixed="right"><template #default="{row}"><template v-if="editingTemplateId === row.id"><el-button link @click="cancelInlineTemplateEdit">取消</el-button><el-button link type="primary" :loading="templateSaving" @click="saveInlineTemplate">保存</el-button></template><template v-else><el-button link type="primary" :disabled="editingTemplateId !== null" @click="startInlineTemplateEdit(row)">编辑</el-button><el-button link type="danger" :disabled="editingTemplateId !== null" @click="deleteIntroTemplate(row)">删除</el-button></template></template></el-table-column>
        </el-table>
      </section>
        </el-tab-pane>
        <el-tab-pane label="教学侧重" name="focus">
      <section class="template-section focus-template-section">
        <div class="template-section-head"><p>以图标、标题和副标题组成内容项，教师入驻与教师详情共用。</p><div class="template-section-actions"><span>共 {{ teachingFocusOptions.length }} 个</span><el-button size="small" :icon="Plus" @click="startNewFocus">新增教学侧重</el-button></div></div>
        <el-table :data="focusTableRows" border stripe row-key="id" empty-text="暂无教学侧重" :row-class-name="focusRowClassName">
          <el-table-column label="图标" width="220"><template #default="{row}"><div v-if="editingFocusId === row.id" class="focus-icon-uploader"><span v-if="inlineFocusDraft.icon" class="focus-icon-thumb"><img v-if="isUploadedFocusIcon(inlineFocusDraft.icon)" :src="inlineFocusDraft.icon" alt="图标预览"><el-icon v-else><component :is="focusIconComponent(inlineFocusDraft.icon)"/></el-icon></span><el-upload accept="image/png,image/jpeg,image/webp,image/svg+xml" :auto-upload="false" :show-file-list="false" @change="handleFocusIconUpload"><el-button size="small" :icon="UploadFilled">{{ inlineFocusDraft.icon ? '重新上传' : '上传图标' }}</el-button></el-upload><small>PNG/JPG/WebP/SVG，≤200KB</small></div><span v-else class="focus-icon-preview"><img v-if="isUploadedFocusIcon(row.icon)" :src="row.icon" :alt="`${row.title}图标`"><el-icon v-else><component :is="focusIconComponent(row.icon)"/></el-icon></span></template></el-table-column>
          <el-table-column label="标题" width="200"><template #default="{row}"><el-input v-if="editingFocusId === row.id" v-model="inlineFocusDraft.title" maxlength="20" placeholder="请输入标题"/><b v-else>{{ row.title }}</b></template></el-table-column>
          <el-table-column label="副标题" min-width="320"><template #default="{row}"><el-input v-if="editingFocusId === row.id" v-model="inlineFocusDraft.subtitle" maxlength="40" show-word-limit placeholder="请输入副标题"/><span v-else>{{ row.subtitle }}</span></template></el-table-column>
          <el-table-column label="操作" width="140" fixed="right"><template #default="{row}"><template v-if="editingFocusId === row.id"><el-button link @click="cancelFocusEdit">取消</el-button><el-button link type="primary" :loading="focusSaving" @click="saveFocusItem">保存</el-button></template><template v-else><el-button link type="primary" :disabled="editingFocusId !== null" @click="startFocusEdit(row)">编辑</el-button><el-button link type="danger" :disabled="editingFocusId !== null" @click="removeFocusItem(row)">删除</el-button></template></template></el-table-column>
        </el-table>
      </section>
        </el-tab-pane>
        <el-tab-pane label="教学成果" name="achievements">
      <section class="template-section achievement-template-section">
        <div class="template-section-head"><p>维护用户端教师主页展示的提分案例，仅在教师内容管理中配置。</p><div class="template-section-actions"><span>共 {{ teachingAchievements.length }} 条</span><el-button size="small" :icon="Plus" @click="startNewAchievement">新增教学成果</el-button></div></div>
        <el-table :data="achievementTableRows" border stripe row-key="id" empty-text="暂无教学成果" :row-class-name="achievementRowClassName">
          <el-table-column label="图标" width="220"><template #default="{row}"><div v-if="editingAchievementId === row.id" class="focus-icon-uploader"><span v-if="inlineAchievementDraft.icon" class="focus-icon-thumb"><img v-if="isUploadedFocusIcon(inlineAchievementDraft.icon)" :src="inlineAchievementDraft.icon" alt="图标预览"><el-icon v-else><component :is="focusIconComponent(inlineAchievementDraft.icon)"/></el-icon></span><el-upload accept="image/png,image/jpeg,image/webp,image/svg+xml" :auto-upload="false" :show-file-list="false" @change="handleAchievementIconUpload"><el-button size="small" :icon="UploadFilled">{{ inlineAchievementDraft.icon ? '重新上传' : '上传图标' }}</el-button></el-upload><small>PNG/JPG/WebP/SVG，≤200KB</small></div><span v-else class="focus-icon-preview"><img v-if="isUploadedFocusIcon(row.icon)" :src="row.icon" :alt="`${row.title}图标`"><el-icon v-else><component :is="focusIconComponent(row.icon)"/></el-icon></span></template></el-table-column>
          <el-table-column label="主标题" min-width="250" show-overflow-tooltip><template #default="{row}"><el-input v-if="editingAchievementId === row.id" v-model="inlineAchievementDraft.title" maxlength="50" show-word-limit placeholder="例如：中考数学从 72 分 → 110 分"/><b v-else>{{ row.title }}</b></template></el-table-column>
          <el-table-column label="副标题" width="210"><template #default="{row}"><el-input v-if="editingAchievementId === row.id" v-model="inlineAchievementDraft.subtitle" maxlength="30" show-word-limit placeholder="例如：初三学生 · 李同学"/><span v-else>{{ row.subtitle }}</span></template></el-table-column>
          <el-table-column label="强化副标题" width="180"><template #default="{row}"><el-input v-if="editingAchievementId === row.id" v-model="inlineAchievementDraft.highlight" maxlength="20" show-word-limit placeholder="例如：提升 38 分"/><strong v-else class="achievement-highlight">{{ row.highlight }}</strong></template></el-table-column>
          <el-table-column label="状态" width="100"><template #default="{row}"><el-switch v-if="editingAchievementId === row.id" v-model="inlineAchievementDraft.enabled" inline-prompt active-text="展示" inactive-text="隐藏"/><el-switch v-else v-model="row.enabled" inline-prompt active-text="展示" inactive-text="隐藏" :disabled="editingAchievementId !== null" @change="updateAchievementStatus"/></template></el-table-column>
          <el-table-column label="操作" width="120" fixed="right"><template #default="{row}"><template v-if="editingAchievementId === row.id"><el-button link @click="cancelAchievementEdit">取消</el-button><el-button link type="primary" :loading="achievementSaving" @click="saveAchievementItem">保存</el-button></template><template v-else><el-button link type="primary" :disabled="editingAchievementId !== null" @click="startAchievementEdit(row)">编辑</el-button></template></template></el-table-column>
        </el-table>
      </section>
        </el-tab-pane>
      </el-tabs>
    </main>
    <main v-else class="content"><el-form ref="queryRef" :model="query" class="filters" label-width="74px"><el-row :gutter="28"><el-col :span="6"><el-form-item label="教师姓名" prop="name"><el-input v-model="query.name" placeholder="请输入教师姓名"/></el-form-item></el-col><el-col :span="6"><el-form-item label="教师手机号" prop="phone"><el-input v-model="query.phone" placeholder="请输入教师手机号"/></el-form-item></el-col><el-col :span="6"><el-form-item label="级别" prop="level"><el-select v-model="query.level" placeholder="所有级别"><el-option v-for="i in ['特级教师','普通讲师']" :key="i" :value="i"/></el-select></el-form-item></el-col><el-col :span="6"><el-form-item label="科目" prop="subject"><el-select v-model="query.subject" placeholder="所有科目"><el-option v-for="i in ['数学','语文','英语','编程']" :key="i" :value="i"/></el-select></el-form-item></el-col><el-col :span="6"><el-form-item label="审核状态" prop="auditStatus"><el-select v-model="query.auditStatus" placeholder="所有审核状态" clearable><el-option v-for="item in ['待审核','审核通过','已驳回']" :key="item" :value="item"/></el-select></el-form-item></el-col><el-col :span="6"><el-form-item label="注册时间" prop="range"><el-date-picker v-model="query.range" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"/></el-form-item></el-col><el-col :span="12" class="filter-actions"><el-button @click="reset">重置</el-button><el-button type="primary" @click="page=1">搜索</el-button><el-link type="primary">收起⌃</el-link></el-col></el-row></el-form>
      <section class="list"><div class="list-head"><b>教师列表</b><div><el-button type="primary" :icon="Plus" @click="add">新增教师</el-button><el-tooltip content="搜索"><el-button circle :icon="Search"/></el-tooltip><el-tooltip content="刷新"><el-button circle :icon="Refresh" @click="refresh"/></el-tooltip><el-tooltip content="全屏"><el-button circle :icon="Expand"/></el-tooltip></div></div><el-table :data="filtered" border row-key="id" height="688"><el-table-column type="selection" width="46"/><el-table-column label="教师信息" width="190"><template #default="{row}"><div class="person"><el-avatar>{{row.initials}}</el-avatar><div><el-link type="primary" :underline="false" @click="open(row)">{{row.name}}</el-link> <em>硕博</em><small>ID: {{row.id}}</small></div></div></template></el-table-column><el-table-column prop="phone" label="手机号" width="120"/><el-table-column prop="type" label="教师类型" width="120"/><el-table-column label="主讲科目" min-width="170"><template #default="{row}"><el-tag v-for="s in row.subjects.slice(0,3)" :key="s" size="small">{{s}}</el-tag><el-tag v-if="row.subjects.length>3" size="small">+{{row.subjects.length-3}}</el-tag></template></el-table-column><el-table-column prop="date" label="注册时间" width="180"/><el-table-column label="上架状态" width="95"><template #default="{row}"><el-switch v-model="row.online" size="small"/></template></el-table-column><el-table-column label="审核状态" width="100"><template #default="{row}"><el-tag :type="row.auditStatus === '审核通过' ? 'success' : row.auditStatus === '待审核' ? 'warning' : 'danger'" size="small">{{row.auditStatus}}</el-tag></template></el-table-column><el-table-column label="操作" fixed="right" width="280"><template #default="{row}"><el-button link type="primary" @click="open(row,false,true)">编辑</el-button><el-button link type="primary">虚拟评价</el-button><el-button link type="primary">关联课程</el-button><el-button link type="primary">排序</el-button></template></el-table-column></el-table><div class="pagebar"><span>共 24 条记录　 <el-select model-value="20条/页" size="small"><el-option value="20条/页"/></el-select></span><el-pagination v-model:current-page="page" :page-size="20" :total="24" layout="prev, pager, next, jumper"/></div></section>
    </main>
  </section>
  <el-drawer v-model="drawer" size="72%" :with-header="false" append-to-body><div class="drawer-top">教师详情 <el-icon @click="drawer=false"><CircleClose/></el-icon></div><el-tabs v-model="active" class="details"><el-tab-pane label="基本认证资料" name="base"><div class="group"><h3>1. 基本资料</h3><el-row :gutter="18"><el-col :span="8"><el-form-item label="手机号" required><el-input :model-value="current.phone.replace('****','2888')" disabled/></el-form-item></el-col></el-row></div><div class="group"><el-row :gutter="18"><el-col :span="8"><el-form-item label="教师姓名" required><el-input v-model="current.name" :disabled="!editing"/></el-form-item></el-col><el-col :span="8"><el-form-item label="教师级别" required><el-select v-model="current.level" :disabled="!editing"><el-option :value="current.level"/></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="性别" required><el-select model-value="男" :disabled="!editing"><el-option value="男"/></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="身份证号" required><el-input model-value="610431198910221221" :disabled="!editing"/></el-form-item></el-col><el-col :span="8"><el-form-item label="年龄"><el-input-number :model-value="35" :disabled="!editing"/></el-form-item></el-col></el-row><el-form-item label="详细地址"><el-input v-model="current.city" :disabled="!editing"/></el-form-item></div><div class="group"><h3>3. 学历与资格认证</h3><el-row :gutter="18"><el-col :span="8"><el-form-item label="最高学历" required><el-select v-model="current.education" :disabled="!editing"><el-option :value="current.education"/></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="是否展示学历"><el-checkbox :model-value="true" :disabled="!editing">显示</el-checkbox></el-form-item></el-col><el-col :span="8"><el-form-item label="毕业院校" required><el-input v-model="current.school" :disabled="!editing"/></el-form-item></el-col></el-row></div><div class="group"><h3>4. 教学能力配置</h3><el-form-item label="授课年级" required><el-checkbox-group v-model="current.grades" :disabled="!editing"><el-checkbox v-for="grade in ['小学','初一-初二','初三','高一-高二','高三']" :key="grade" :label="grade"/></el-checkbox-group></el-form-item><el-form-item label="授课科目" required><el-checkbox-group v-model="current.subjects" :disabled="!editing"><el-checkbox v-for="s in ['语文','数学','英语','物理','化学','生物','历史','地理','政治','编程','美术','音乐']" :key="s" :label="s"/></el-checkbox-group></el-form-item><el-row :gutter="18"><el-col :span="8"><el-form-item label="教龄" required><el-input-number v-model="current.experience" :disabled="!editing" :min="0" :max="99" :step="1" controls-position="right"/></el-form-item></el-col><el-col :span="8"><el-form-item label="授课方式"><el-checkbox :model-value="true" :disabled="!editing">线上</el-checkbox>　<el-checkbox :disabled="!editing">线下</el-checkbox>　<el-checkbox :model-value="true" :disabled="!editing">上门</el-checkbox></el-form-item></el-col></el-row><el-form-item label="资质证明"><div class="proof">超过家长会员1000元</div></el-form-item></div><div class="group"><h3>5. 照片与认证材料</h3><el-row><el-col :span="12"><el-form-item label="教师头像"><el-avatar :size="52">{{current.initials}}</el-avatar></el-form-item></el-col><el-col :span="12"><el-form-item label="教师形象照片"><div class="photo">教师形象照</div></el-form-item></el-col></el-row></div></el-tab-pane><el-tab-pane label="页面展示资料" name="display"><div class="group"><h3>6. 展示与运营设置</h3><el-row :gutter="18"><el-col :span="8"><el-form-item label="教师类型" required><el-select v-model="current.type"><el-option v-for="item in enabledTeacherTypes" :key="item.id" :label="item.parentType" :value="item.parentType"/></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="二级类型"><el-select model-value="硕博"><el-option value="硕博"/></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="教师状态" required><el-select model-value="审核中"><el-option value="审核中"/></el-select></el-form-item></el-col></el-row><el-row :gutter="18"><el-col :span="8"><el-form-item label="授课时长（小时）" required><el-input-number v-model="current.hours"/></el-form-item></el-col><el-col :span="8"><el-form-item label="虚拟收藏人数" required><el-input-number :model-value="99"/></el-form-item></el-col></el-row><el-form-item label="教师标签"><el-tag>考研英语</el-tag> <el-tag>高分写作</el-tag></el-form-item></div><div class="group"><h3>7. 教师介绍</h3><el-form-item label="个人简介" required><el-input v-model="current.intro" type="textarea" :rows="4"/></el-form-item><el-form-item label="简介是否展示"><el-select model-value="展示" style="width:205px"><el-option value="展示"/></el-select></el-form-item></div><div class="group"><h3>8. 教学内容配置</h3><el-table :data="[]" border><el-table-column label="标题"/><el-table-column label="描述"/><el-table-column label="排序"/><el-table-column label="是否展示"/><el-table-column label="操作"/></el-table></div><div class="group"><h3>9. 授课特色</h3><el-table :data="[]" border><el-table-column label="特色文案"/><el-table-column label="排序"/><el-table-column label="是否展示"/><el-table-column label="操作"/></el-table></div></el-tab-pane></el-tabs><div class="drawer-foot"><el-button @click="drawer=false">关闭</el-button><el-button v-if="editing" type="primary" :loading="saving" @click="save">保存</el-button></div></el-drawer>
</div>
  <el-dialog v-model="drawer" class="teacher-editor" width="1280px" top="6vh" append-to-body :close-on-click-modal="false" :show-close="false">
    <template #header><div class="editor-title"><span>{{ editing ? '编辑教师' : '教师详情' }}</span><div class="editor-title-actions"><el-button v-if="!editing" :icon="EditPen" @click="beginTeacherEdit">编辑</el-button><el-button v-if="!editing && current.auditStatus === '待审核'" type="primary" @click="auditDialog=true">审核</el-button><el-button link :icon="CircleClose" @click="drawer=false"/></div></div></template>
    <div class="editor-layout">
      <aside class="teacher-summary">
        <div class="summary-photo" aria-label="教师形象照"></div>
        <h2>{{ current.name }}</h2><div class="summary-role"><el-tag type="info">{{ current.type }}</el-tag><el-tag type="primary">硕博</el-tag></div><span class="summary-id">ID: {{ current.id }}</span>
        <div class="summary-status"><el-tag :type="current.online ? 'success' : 'info'">{{ current.online ? '已上架' : '未上架' }}</el-tag><el-tag :type="current.auditStatus === '审核通过' ? 'success' : current.auditStatus === '待审核' ? 'warning' : 'danger'">{{ current.auditStatus }}</el-tag></div>
        <div class="summary-lines"><div><span>手机号</span><b>{{ current.phone.replace('****','2888') }}</b></div><div><span>注册时间</span><b>{{ current.date }}</b></div><div><span>授课科目</span><b>{{ current.subjects.join(' / ') }}</b></div><div><span>授课年级</span><b>{{ current.grades.join(' / ') }}</b></div></div>
      </aside>
      <el-scrollbar class="editor-body">
        <el-form :model="current" label-position="top" class="editor-form" :disabled="!editing">
          <section class="form-section"><h3>基本资料</h3><el-row :gutter="14"><el-col :span="5"><el-form-item label="教师姓名" required><el-input v-model="current.name" :disabled="!editing"/></el-form-item></el-col><el-col :span="5"><el-form-item label="手机号"><el-input :model-value="current.phone.replace('****','2888')" disabled/></el-form-item></el-col><el-col :span="5"><el-form-item label="教师类型" required><el-select v-model="current.type" :disabled="!editing"><el-option v-for="item in enabledTeacherTypes" :key="item.id" :label="item.name" :value="item.name"/></el-select></el-form-item></el-col><el-col :span="4"><el-form-item label="性别" required><el-select model-value="男" :disabled="!editing"><el-option value="男"/><el-option value="女"/></el-select></el-form-item></el-col><el-col :span="5"><el-form-item label="年龄"><el-input class="numeric-input" model-value="35" type="number" inputmode="numeric" :disabled="!editing" min="18" max="80" step="1"/></el-form-item></el-col></el-row></section>
          <section class="form-section"><h3>教学能力配置</h3><el-form-item label="授课年级" required><el-checkbox-group v-model="current.grades" :disabled="!editing" @change="handleGradesChange"><el-checkbox v-for="grade in ['小学','初一-初二','初三','高一-高二','高三']" :key="grade" :label="grade"/></el-checkbox-group></el-form-item><el-form-item label="授课科目" required><el-checkbox-group v-model="current.subjects" :disabled="!editing"><el-checkbox v-for="subject in subjectOptions" :key="subject" :label="subject" :disabled="!editing || isSubjectDisabled(subject)"/></el-checkbox-group></el-form-item><el-row :gutter="18"><el-col :span="8"><el-form-item label="教龄（年）" required><el-input-number v-model="current.experience" :disabled="!editing" :min="0" :max="99" :step="1" controls-position="right"/></el-form-item></el-col><el-col :span="16"><el-form-item label="授课方式"><el-checkbox :model-value="true" :disabled="!editing">线上</el-checkbox><el-checkbox :disabled="!editing">线下</el-checkbox><el-checkbox :model-value="true" :disabled="!editing">上门</el-checkbox></el-form-item></el-col></el-row></section>
          <section class="form-section"><h3>学历与资格认证</h3><el-row :gutter="18"><el-col :span="8"><el-form-item label="最高学历" required><el-select v-model="current.education" :disabled="!editing"><el-option value="本科"/><el-option value="硕士研究生"/><el-option value="博士研究生"/></el-select></el-form-item></el-col><el-col :span="8"><el-form-item label="毕业院校" required><el-input v-model="current.school" :disabled="!editing"/></el-form-item></el-col><el-col :span="8"><el-form-item label="学历展示"><el-switch :model-value="true" :disabled="!editing" active-text="展示" inactive-text="隐藏"/></el-form-item></el-col></el-row><el-form-item label="资质证明"><div class="qualification-proof">已上传资质材料</div></el-form-item></section>
          <section class="form-section"><h3>教学侧重</h3><el-form-item label="教学侧重（最多 3 项）"><el-checkbox-group v-model="teachingFocus" :disabled="!editing" class="teacher-focus-options" @change="limitTeachingFocusSelection"><el-checkbox v-for="focus in teachingFocusOptions" :key="focus.id" :label="focus.title" :disabled="!editing || isTeachingFocusOptionDisabled(focus.title)" :class="{ 'is-limit-disabled': editing && isTeachingFocusOptionDisabled(focus.title) }"><span class="teacher-focus-card"><img v-if="isUploadedFocusIcon(focus.icon)" :src="focus.icon" :alt="`${focus.title}图标`"><el-icon v-else><component :is="focusIconComponent(focus.icon)"/></el-icon><span><b>{{ focus.title }}</b><small>{{ focus.subtitle }}</small></span></span></el-checkbox></el-checkbox-group><p class="teaching-focus-limit">已选 {{ teachingFocus.length }}/3 项</p></el-form-item></section>
          <section class="form-section"><h3>教师标签</h3><el-form-item label="教师标签"><el-select v-model="current.tags" multiple filterable collapse-tags :max-collapse-tags="4" placeholder="请选择教师标签" :disabled="!editing"><el-option v-for="tag in enabledTeacherTags" :key="tag.id" :label="tag.name" :value="tag.name"/></el-select></el-form-item></section>
          <section class="form-section"><h3>教师介绍与形象照</h3><el-row :gutter="18"><el-col :span="16"><el-form-item label="个人简介" required><el-input v-model="current.intro" type="textarea" :rows="4" :maxlength="300" show-word-limit :disabled="!editing"/></el-form-item></el-col><el-col :span="8"><el-form-item label="教师形象照" required><div class="portrait-upload"><div class="portrait-pair"><div class="portrait-item"><el-image class="portrait-preview" :src="originalPortraitUrl" :preview-src-list="[originalPortraitUrl]" :preview-teleported="true" fit="cover" alt="用户上传原图"/><span>用户上传原图</span></div><div class="portrait-item"><div v-if="portraitGenerating" class="portrait-generating"><el-icon class="is-loading"><Loading/></el-icon><span>AI 生成中</span></div><el-image v-else class="portrait-preview" :src="aiPortraitUrl" :preview-src-list="[aiPortraitUrl]" :preview-teleported="true" fit="cover" alt="AI 生成图"/><span>AI 生成图</span></div></div><el-upload v-if="editing" accept="image/png,image/jpeg,image/webp" :auto-upload="false" :show-file-list="false" :disabled="portraitGenerating" @change="startPortraitGeneration"><el-button :icon="UploadFilled" :disabled="portraitGenerating">{{ portraitGenerating ? 'AI 生成中' : '重新上传原图' }}</el-button></el-upload></div></el-form-item></el-col></el-row></section>
        </el-form>
      </el-scrollbar>
    </div>
    <template #footer><el-button v-if="editing" @click="cancelTeacherEdit">取消</el-button><el-button v-else @click="drawer=false">关闭</el-button><el-button v-if="editing" type="primary" :loading="saving" :disabled="portraitGenerating" @click="save">保存</el-button></template>
  </el-dialog>
  <el-dialog v-model="auditDialog" title="教师审核" width="480px" append-to-body :close-on-click-modal="false" class="audit-dialog">
    <el-form label-position="top"><el-form-item label="审核结论" required><el-radio-group v-model="auditDecision"><el-radio value="审核通过">审核通过</el-radio><el-radio value="已驳回">驳回申请</el-radio></el-radio-group></el-form-item><el-form-item label="审核意见" :required="auditDecision === '已驳回'"><el-input v-model="auditNote" type="textarea" :rows="3" maxlength="200" show-word-limit :placeholder="auditDecision === '已驳回' ? '请填写驳回原因' : '可填写审核说明'"/></el-form-item></el-form>
    <template #footer><el-button @click="auditDialog=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitAudit">确认审核</el-button></template>
  </el-dialog>
</template>

<style>
.template-management .el-table .template-editing-row td.el-table__cell{background:#f5f9ff!important;vertical-align:top}.template-management .template-editing-row .cell{padding-top:10px;padding-bottom:10px}.inline-template-content textarea{min-height:54px!important}.template-content-text{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.template-editing-row .el-textarea__inner{font-size:13px;line-height:20px}.template-editing-row .el-input__count{line-height:18px}.template-editing-row .inline-config-number{width:112px}
.achievement-highlight{color:#1677ff;letter-spacing:0}.achievement-template-section .el-table b,.achievement-template-section .el-table strong{letter-spacing:0}
.person .el-avatar,.photo{background-image:url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=480&q=85');background-position:center;background-size:cover;color:transparent}
.details .group:has(.photo) .el-col:first-child{display:none}
.details .group:has(.photo) .el-col:last-child{max-width:100%;flex:0 0 100%}
.summary-role{display:flex;gap:6px;margin:2px 0 4px}.summary-role .el-tag{border:0;font-size:12px}
</style>

<style>
.screen.is-embedded .side,.screen.is-embedded .top,.screen.is-embedded .tabs{display:none}.screen.is-embedded .content{padding:14px}.screen.is-embedded .main{width:100%}.screen.is-embedded .filters,.screen.is-embedded .list{min-width:0}
</style>

<style>
.nav svg{width:16px!important;height:16px!important;margin-right:7px;flex:none}.nav .el-menu-item .el-icon,.nav .el-sub-menu__title .el-icon{width:16px;height:16px;margin-right:7px}.nav .el-menu-item .el-icon svg,.nav .el-sub-menu__title .el-icon svg{width:16px;height:16px}
.nav>.el-menu-item,.nav>.el-sub-menu:not(:nth-child(3)),.nav>.el-sub-menu:nth-child(3) .el-menu-item:not(.is-active){display:none}
.tabs span{display:none}
.filters .el-form-item{display:flex;align-items:center;min-width:0}.filters .el-form-item__label{flex:0 0 74px;white-space:nowrap;font-size:12px;line-height:32px}.filters .el-form-item__content{min-width:0}.filter-actions{height:32px;padding:0 0 0 74px;justify-content:flex-end;align-items:center;white-space:nowrap}
.filters .el-input__inner,.filters .el-select__selected-item,.filters .el-range-input,.filters .el-button,.filters .el-link{font-size:12px!important}.filters .filter-actions{display:flex!important;height:32px;padding:0!important;justify-content:flex-end!important;align-items:center!important;white-space:nowrap}
.list-head>div>.el-button:nth-of-type(2),.list-head>div>.el-button:nth-of-type(3){display:none}
.el-table .cell{white-space:nowrap}
.details .el-tabs__header{display:none}.details .el-tab-pane{display:block!important}
.grade-options{display:flex;flex-wrap:wrap;gap:8px}.grade-options .el-checkbox-button{margin:0}.grade-options .el-checkbox-button__inner{border:1px solid #8fc6eb!important;border-radius:3px!important;box-shadow:none!important;background:#fff;color:#347ea8;font-size:13px}.grade-options .el-checkbox-button.is-checked .el-checkbox-button__inner{border-color:#409eff!important;background:#409eff;color:#fff}
</style>

<style>
.el-overlay.is-drawer{display:none!important}
.teacher-editor{--el-dialog-padding-primary:0;width:min(1280px,calc(100vw - 96px))!important;border-radius:8px;overflow:hidden}.teacher-editor .el-dialog__header{height:58px;margin:0;padding:0;border-bottom:1px solid #e7ebf1}.editor-title{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;font-size:16px;font-weight:600;color:#253044}.editor-title-actions{display:flex;align-items:center;gap:10px}.editor-title-actions .el-button--primary{min-width:64px;height:32px;font-weight:600}.editor-title-actions .el-button.is-link{font-size:20px;color:#8791a1}.teacher-editor .el-dialog__body{padding:0;background:#fff}.teacher-editor .el-dialog__footer{height:66px;padding:14px 20px;border-top:1px solid #e7ebf1;background:#fff}
.editor-layout{display:grid;grid-template-columns:250px minmax(0,1fr);height:min(660px,calc(88vh - 124px));min-height:420px;background:#fff!important}.teacher-summary{margin:18px 0 18px 18px;padding:20px;background:#f7f9fc;border:1px solid #dfe8f4;border-radius:7px}.summary-photo{background-image:url('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=480&q=85');background-position:center;background-size:cover}.summary-photo{width:84px;height:84px;margin-bottom:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 5px rgb(30 50 70 / 15%)}.teacher-summary h2{margin:0 0 5px;font-size:18px;color:#2b3443}.teacher-summary p,.summary-id{margin:0;color:#7a8798;font-size:13px}.summary-id{display:block;margin-top:4px}.summary-status{display:flex;gap:6px;margin:16px 0}.summary-status .el-tag{border:0}.summary-lines{border-top:1px solid #dbe4ef}.summary-lines div{padding:12px 0;border-bottom:1px solid #dbe4ef}.summary-lines span,.summary-lines b{display:block;font-size:12px}.summary-lines span{margin-bottom:4px;color:#8490a2}.summary-lines b{font-weight:500;color:#485568;line-height:18px;word-break:break-all}
.editor-body{height:100%;padding:18px 26px 24px}.editor-form{max-width:850px}.form-section{padding:0 0 16px;margin-bottom:16px;border-bottom:1px solid #ebeff4}.form-section:last-child{border-bottom:0}.form-section h3{margin:0 0 14px;font-size:14px;color:#2f3a4b}.editor-form .el-form-item{margin-bottom:14px}.editor-form .el-form-item__label{padding-bottom:5px;font-size:12px;line-height:18px;color:#606b7a}.editor-form .el-select,.editor-form .el-input-number{width:100%}.editor-form .el-checkbox{margin-right:18px;font-size:12px}.editor-form .el-tag{margin-right:5px}.teacher-focus-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%}.editor-form .teacher-focus-options .el-checkbox{position:relative;align-items:stretch;width:100%;height:auto;min-height:92px;margin:0;padding:12px;border:1px solid #dfe6ee;border-radius:5px;background:#fff;white-space:normal}.teacher-focus-options .el-checkbox__input{position:absolute;opacity:0;pointer-events:none}.teacher-focus-options .el-checkbox__label{width:100%;padding:0;white-space:normal}.teacher-focus-options .el-checkbox.is-checked{border-color:#409eff;background:#f3f8ff}.teacher-focus-options .el-checkbox.is-disabled{opacity:1}.teacher-focus-options .el-checkbox.is-disabled .el-checkbox__label{color:inherit}.teacher-focus-card{display:flex;align-items:flex-start;gap:10px}.teacher-focus-card>.el-icon,.teacher-focus-card>img{flex:0 0 25px;width:25px;height:25px;margin-top:1px}.teacher-focus-card>.el-icon{color:#1677ff;font-size:25px}.teacher-focus-card>img{object-fit:contain}.teacher-focus-card b,.teacher-focus-card small{display:block;letter-spacing:0}.teacher-focus-card b{margin-bottom:5px;color:#2f3a4b;font-size:13px;line-height:18px}.teacher-focus-card small{color:#7b8796;font-size:11px;line-height:17px}.numeric-input input::-webkit-outer-spin-button,.numeric-input input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.numeric-input input[type=number]{appearance:textfield;-moz-appearance:textfield}.qualification-proof{display:flex;align-items:center;width:150px;height:42px;padding:0 12px;border:1px dashed #b9d3ed;border-radius:4px;background:#f5faff;color:#4383b8;font-size:12px}.portrait-upload{display:flex;align-items:flex-start;flex-direction:column;gap:10px;min-height:104px}.portrait-pair{display:flex;gap:10px}.portrait-item{display:grid;gap:5px;min-width:0}.portrait-item>span{color:#606b7a;font-size:12px;line-height:18px;text-align:center}.portrait-preview{display:block;width:104px;height:78px;border:1px solid #dfe6ee;border-radius:4px;overflow:hidden}.portrait-generating{display:flex;align-items:center;justify-content:center;gap:5px;width:104px;height:78px;border:1px dashed #99c7ec;border-radius:4px;background:#f5faff;color:#4383b8;font-size:12px}.portrait-generating .el-icon{font-size:16px}.portrait-upload .el-button{padding:0}@media(max-width:760px){.portrait-pair{flex-wrap:wrap}}
@media(max-width:1100px){.teacher-editor{width:94%!important}.editor-layout{grid-template-columns:210px minmax(0,1fr)}.teacher-summary{margin-left:12px}.editor-body{padding:18px}.editor-form{min-width:620px}}
</style>

<style>
.template-management{min-height:100vh;background:#f4f6f9}.template-page-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.template-page-head h1{margin:0;color:#253044;font-size:20px;letter-spacing:0}.template-page-head p{margin:6px 0 0;color:#7b8796;font-size:13px}.template-management>.el-alert{margin-bottom:16px}.content-management-tabs>.el-tabs__header{margin:0}.content-management-tabs>.el-tabs__header .el-tabs__item{height:42px;font-weight:600}.content-management-tabs .template-section{margin-top:0}.template-section{margin-top:16px;padding:18px 20px;background:#fff;border:1px solid #e2e7ee;border-radius:6px}.template-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}.template-section-head h2{margin:0;color:#2f3a4b;font-size:16px;letter-spacing:0}.template-section-head p{margin:0;color:#7b8796;font-size:12px}.template-section-head>span,.template-section-actions>span{color:#7b8796;font-size:12px}.template-section-actions{display:flex;align-items:center;gap:12px}.focus-icon-preview,.focus-icon-thumb{display:inline-grid;width:34px;height:34px;place-items:center}.focus-icon-preview img,.focus-icon-thumb img{width:30px;height:30px;object-fit:contain}.focus-icon-preview .el-icon,.focus-icon-thumb .el-icon{color:#1677ff;font-size:26px}.focus-icon-uploader{display:grid;grid-template-columns:38px auto;align-items:center;gap:4px 8px}.focus-icon-uploader small{grid-column:1/-1;color:#8a96a5;font-size:11px;letter-spacing:0}.focus-template-section .el-table b{letter-spacing:0}.teacher-tag-section{overflow:hidden}.teacher-tag-section .el-table .el-tag{height:24px;padding:0 8px;font-size:12px}.teacher-tag-pagebar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:14px;color:#7b8796;font-size:12px}.teaching-focus-limit{width:100%;margin:8px 0 0;color:#7b8796;font-size:12px;line-height:18px}.teacher-focus-options .el-checkbox.is-limit-disabled{border-color:#e5eaf0;background:#f6f8fa;opacity:.5;cursor:not-allowed}.teacher-focus-options .el-checkbox.is-limit-disabled .teacher-focus-card b,.teacher-focus-options .el-checkbox.is-limit-disabled .teacher-focus-card small,.teacher-focus-options .el-checkbox.is-limit-disabled .teacher-focus-card>.el-icon{color:#8d99a8}.screen.is-embedded .template-management{padding:20px 24px}.screen.is-embedded .template-section{margin-top:0}@media(max-width:1100px){.teacher-tag-pagebar{align-items:flex-start;flex-direction:column}}
</style>
