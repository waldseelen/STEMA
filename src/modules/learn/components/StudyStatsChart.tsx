import React from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import { echarts } from '@/shared/lib/echarts'
import { TrendingUp, PieChart } from 'lucide-react'

interface CalibrationPoint {
  name: string
  value: [number, number]
}

interface CalibrationChartProps {
  isTr: boolean
  calibrationPoints: CalibrationPoint[]
}

export function CalibrationChart({ isTr, calibrationPoints }: CalibrationChartProps) {
  if (calibrationPoints.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-lg p-5 bg-[var(--bg-surface-100)]/30 space-y-2">
        <TrendingUp className="h-8 w-8 text-[var(--text-muted)] mx-auto" />
        <h4 className="text-xs font-bold text-[var(--text-primary)]">
          {isTr ? 'Metakognitif Veri Bekleniyor' : 'Calibration Data Pending'}
        </h4>
        <p className="text-2xs text-[var(--text-secondary)] leading-relaxed">
          {isTr
            ? 'Sokratik sohbet başlangıcında kendinize verdiğiniz güven puanları (1-5) ile çözümlerdeki ipucu/hata sıklığınız karşılaştırılarak kalibrasyon grafiğinde listelenecektir.'
            : 'Start Socratic chat, rate your confidence, and complete tasks to see calibration results here.'}
        </p>
      </div>
    )
  }

  const scatterOption = {
    grid: { top: 30, right: 20, bottom: 40, left: 30 },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.seriesType === 'line') return ''
        const data = params.data
        return `<strong>${data.name}</strong><br/>` +
               (isTr ? `Tahmin (Güven): ${data.value[0]}<br/>Gerçek Performans: ${data.value[1]}`
                     : `Prediction: ${data.value[0]}<br/>Actual: ${data.value[1]}`)
      }
    },
    xAxis: {
      name: isTr ? 'Tahmin' : 'Pred',
      nameLocation: 'middle',
      nameGap: 20,
      min: 1,
      max: 5,
      interval: 1,
      splitLine: { show: true, lineStyle: { type: 'dashed', color: 'var(--border-subtle)' } },
      axisLabel: { fontSize: 9 }
    },
    yAxis: {
      name: isTr ? 'Gerçek' : 'Act',
      nameLocation: 'end',
      min: 1,
      max: 5,
      interval: 1,
      splitLine: { show: true, lineStyle: { type: 'dashed', color: 'var(--border-subtle)' } },
      axisLabel: { fontSize: 9 }
    },
    series: [
      {
        type: 'scatter',
        data: calibrationPoints,
        symbolSize: 8,
        itemStyle: { color: '#3b82f6' }
      },
      {
        type: 'line',
        data: [[1, 1], [5, 5]],
        silent: true,
        lineStyle: { type: 'dashed', color: '#94a3b8', width: 1 },
        symbol: 'none'
      }
    ]
  }

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg p-3 bg-[var(--bg-primary)]">
      <h4 className="text-2xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono mb-2">
        {isTr ? 'Tahmin vs Gerçek Başarı (Kalibrasyon)' : 'Prediction vs Actual Success (Calibration)'}
      </h4>
      <ReactEChartsCore echarts={echarts} option={scatterOption} style={{ height: '220px', width: '100%' }} />
      <p className="text-[9px] text-[var(--text-muted)] leading-relaxed mt-2">
        {isTr
          ? 'Grafikteki kesikli çizgi mükemmel kalibrasyonu gösterir. Bu çizgiye yakın olmak, öğrenme sürecinde kendi bilginizi ne derece doğru değerlendirdiğinizi simgeler.'
          : 'The dashed line indicates perfect metacognitive calibration. Closer dots mean accurate self-assessment.'}
      </p>
    </div>
  )
}

interface ErrorLog {
  error_type: string
  [key: string]: any
}

interface ErrorTypeChartProps {
  isTr: boolean
  errorLogs: ErrorLog[]
}

export function ErrorTypeChart({ isTr, errorLogs }: ErrorTypeChartProps) {
  const counts = { conceptual: 0, procedural: 0, calculation: 0, strategic: 0 }
  errorLogs.forEach(log => {
    const type = log.error_type as keyof typeof counts
    if (counts[type] !== undefined) counts[type]++
  })

  const errorData = [
    { value: counts.conceptual, name: isTr ? 'Kavramsal' : 'Conceptual', itemStyle: { color: '#ef4444' } },
    { value: counts.procedural, name: isTr ? 'Yöntemsel' : 'Procedural', itemStyle: { color: '#f59e0b' } },
    { value: counts.calculation, name: isTr ? 'İşlem' : 'Calculation', itemStyle: { color: '#3b82f6' } },
    { value: counts.strategic, name: isTr ? 'Stratejik' : 'Strategic', itemStyle: { color: '#8b5cf6' } }
  ].filter(item => item.value > 0)

  if (errorData.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-lg p-5 bg-[var(--bg-surface-100)]/30 space-y-2">
        <PieChart className="h-8 w-8 text-[var(--text-muted)] mx-auto" />
        <h4 className="text-xs font-bold text-[var(--text-primary)]">
          {isTr ? 'Hata Dağılım Verisi Yok' : 'No Errors Tracked'}
        </h4>
        <p className="text-2xs text-[var(--text-secondary)] leading-relaxed">
          {isTr
            ? 'Sokratik derslerde yaptığınız hatalar yapay zeka tarafından kategorize edilerek hata dağılım pastasından analiz edilecektir.'
            : 'Mistakes made during Socratic learning will be categorized and analyzed here.'}
        </p>
      </div>
    )
  }

  const pieOption = {
    grid: { top: 10, bottom: 10, left: 10, right: 10 },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { fontSize: 8, color: 'var(--text-secondary)' }
    },
    series: [
      {
        name: isTr ? 'Hata Türleri' : 'Error Types',
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 10,
            fontWeight: 'bold',
            formatter: '{b}\n{c} ({d}%)'
          }
        },
        data: errorData
      }
    ]
  }

  return (
    <div className="border border-[var(--border-subtle)] rounded-lg p-3 bg-[var(--bg-primary)]">
      <h4 className="text-2xs font-bold uppercase tracking-wider text-[var(--text-secondary)] font-mono mb-2">
        {isTr ? 'Hata Türü Dağılım Analitiği' : 'Error Type Distribution Analytics'}
      </h4>
      <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: '200px', width: '100%' }} />
      <p className="text-[9px] text-[var(--text-muted)] leading-relaxed mt-2">
        {isTr
          ? 'Hata türlerinizi öğrenerek hangi aşamalarda aksadığınızı görebilir ve Feynman modunda zayıf noktalarınıza ağırlık verebilirsiniz.'
          : 'Track your mistakes by type to identify and address specific learning bottlenecks.'}
      </p>
    </div>
  )
}
