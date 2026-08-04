export type ReviewStatus = '待审核' | '待补充' | '已通过' | '已驳回' | '已停用'
export type TeacherStatus = '待上架' | '已上架' | '已下架'

export interface Teacher {
  id: string
  name: string
  phone: string
  avatar: string
  level: string
  subjects: string[]
  grades: string[]
  city: string
  experience: number
  reviewStatus: ReviewStatus
  teacherStatus: TeacherStatus
  appliedAt: string
  reviewer?: string
  reviewAt?: string
  school: string
  education: string
  certificate: '已验证' | '待核验' | '缺失'
  intro: string
  courseHours: number
  rating?: number
  rejectReason?: string
}

export const teacherRows: Teacher[] = [
  { id: 'T20260731001', name: '王语晨', phone: '130****8881', avatar: '王', level: '特级教师', subjects: ['数学', '物理'], grades: ['初二', '初三', '高一'], city: '杭州', experience: 12, reviewStatus: '待审核', teacherStatus: '待上架', appliedAt: '2026-07-31 09:18', school: '浙江大学', education: '硕士研究生', certificate: '已验证', intro: '12 年初高中数学教学经验，擅长梳理知识体系和拔高训练。', courseHours: 0 },
  { id: 'T20260730018', name: '陈思敏', phone: '151****4147', avatar: '陈', level: '专业教师', subjects: ['语文'], grades: ['四年级', '五年级', '六年级'], city: '上海', experience: 7, reviewStatus: '待审核', teacherStatus: '待上架', appliedAt: '2026-07-30 16:42', school: '华东师范大学', education: '本科', certificate: '待核验', intro: '专注小学语文阅读与写作，重视课内基础与表达训练。', courseHours: 0 },
  { id: 'T20260729006', name: '李哲', phone: '138****9286', avatar: '李', level: '骨干教师', subjects: ['英语'], grades: ['一年级', '二年级', '三年级'], city: '南京', experience: 5, reviewStatus: '待补充', teacherStatus: '待上架', appliedAt: '2026-07-29 14:10', school: '南京师范大学', education: '本科', certificate: '缺失', intro: '自然拼读与分级阅读方向，课堂互动性强。', courseHours: 0 },
  { id: 'T20260723012', name: '刘老师', phone: '151****8847', avatar: '刘', level: '专业教师', subjects: ['数学', '语文'], grades: ['三年级', '四年级'], city: '苏州', experience: 8, reviewStatus: '已通过', teacherStatus: '已上架', appliedAt: '2026-07-23 11:25', reviewer: '张宁', reviewAt: '2026-07-24 10:06', school: '苏州大学', education: '本科', certificate: '已验证', intro: '小学全科辅导经验丰富，善于建立学习习惯。', courseHours: 689, rating: 4.9 },
  { id: 'T20260718025', name: '赵佳宁', phone: '137****7903', avatar: '赵', level: '普通讲师', subjects: ['化学'], grades: ['高一', '高二'], city: '北京', experience: 3, reviewStatus: '已驳回', teacherStatus: '待上架', appliedAt: '2026-07-18 18:32', reviewer: '陈蕾', reviewAt: '2026-07-19 09:14', school: '首都师范大学', education: '本科', certificate: '待核验', intro: '高中化学同步辅导。', courseHours: 0, rejectReason: '请补充教师资格证照片及完整的教学经历。' },
  { id: 'T20260712008', name: '杨芷涵', phone: '133****0662', avatar: '杨', level: '专业教师', subjects: ['美术'], grades: ['一年级', '二年级'], city: '武汉', experience: 6, reviewStatus: '已停用', teacherStatus: '已下架', appliedAt: '2026-07-12 10:55', reviewer: '张宁', reviewAt: '2026-07-13 15:46', school: '湖北美术学院', education: '本科', certificate: '已验证', intro: '儿童创意美术与素描启蒙。', courseHours: 128, rating: 4.8 }
]

export const delay = (ms = 420): Promise<void> => new Promise(resolve => window.setTimeout(resolve, ms))
export async function fetchTeachers(): Promise<void> { await delay() }
export async function saveTeacher(): Promise<void> { await delay(580) }
