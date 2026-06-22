import * as echarts from 'echarts/core'
import {
    BarChart,
    PieChart,
    ScatterChart
} from 'echarts/charts'
import {
    TooltipComponent,
    GridComponent,
    TitleComponent,
    LegendComponent,
    DatasetComponent
} from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

echarts.use([
    BarChart,
    PieChart,
    ScatterChart,
    TooltipComponent,
    GridComponent,
    TitleComponent,
    LegendComponent,
    DatasetComponent,
    SVGRenderer
])

export { echarts }
