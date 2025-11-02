<script lang="ts">
	let { data } = $props<{ data: Array<{ day: string; credits: number }> }>();
	
	// Calculate chart dimensions and scaling
	const width = 600;
	const height = 300;
	const padding = { top: 20, right: 30, bottom: 40, left: 50 };
	const chartWidth = width - padding.left - padding.right;
	const chartHeight = height - padding.top - padding.bottom;
	
	// Find max value for Y-axis scaling
	const maxValue = Math.max(...data.map((d: {day: string, credits: number}) => d.credits), 1);
	const maxY = Math.ceil(maxValue * 1.1); // Add 10% padding
	
	// Calculate points for the line
	function getPoint(index: number) {
		const x = (index / (data.length - 1)) * chartWidth + padding.left;
		const y = height - padding.bottom - (data[index].credits / maxY) * chartHeight;
		return { x, y };
	}
	
	// Generate SVG path for the line
	function getPath() {
		if (data.length === 0) return '';
		
		let path = `M ${getPoint(0).x} ${getPoint(0).y}`;
		for (let i = 1; i < data.length; i++) {
			const { x, y } = getPoint(i);
			path += ` L ${x} ${y}`;
		}
		return path;
	}
	
	// Generate area path for fill effect
	function getAreaPath() {
		if (data.length === 0) return '';
		
		const firstPoint = getPoint(0);
		const lastPoint = getPoint(data.length - 1);
		let path = `M ${firstPoint.x} ${height - padding.bottom} L ${firstPoint.x} ${firstPoint.y}`;
		for (let i = 1; i < data.length; i++) {
			const { x, y } = getPoint(i);
			path += ` L ${x} ${y}`;
		}
		path += ` L ${lastPoint.x} ${height - padding.bottom} Z`;
		return path;
	}
</script>

<div class="h-80 w-full overflow-x-auto">
	<svg width={width} height={height} class="w-full" viewBox="0 0 {width} {height}">
		<!-- Grid lines -->
		<defs>
			<linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
				<stop offset="0%" stop-color="#22c55e" stop-opacity="0.3" />
				<stop offset="100%" stop-color="#22c55e" stop-opacity="0.05" />
			</linearGradient>
		</defs>
		
		<!-- Vertical grid lines -->
		{#each data as _, i}
			<line
				x1={getPoint(i).x}
				y1={padding.top}
				x2={getPoint(i).x}
				y2={height - padding.bottom}
				stroke="#e2e8f0"
				stroke-width="1"
				stroke-dasharray="3 3"
			/>
		{/each}
		
		<!-- Horizontal grid lines -->
		{#each Array(5) as _, i}
			{@const y = padding.top + (i / 4) * chartHeight}
			<line
				x1={padding.left}
				y1={y}
				x2={width - padding.right}
				y2={y}
				stroke="#e2e8f0"
				stroke-width="1"
				stroke-dasharray="3 3"
			/>
		{/each}
		
		<!-- Area fill -->
		<path
			d={getAreaPath()}
			fill="url(#areaGradient)"
		/>
		
		<!-- Line -->
		<path
			d={getPath()}
			stroke="#22c55e"
			stroke-width="3"
			fill="none"
			class="drop-shadow-sm"
		/>
		
		<!-- Data points -->
		{#each data as item, i}
			{@const point = getPoint(i)}
			<circle
				cx={point.x}
				cy={point.y}
				r="6"
				fill="#22c55e"
				stroke="#fff"
				stroke-width="2"
				class="hover:r-8 transition-all cursor-pointer"
			/>
		{/each}
		
		<!-- X-axis labels -->
		{#each data as item, i}
			<text
				x={getPoint(i).x}
				y={height - padding.bottom + 20}
				text-anchor="middle"
				font-size="12"
				fill="#64748b"
				font-family="system-ui, sans-serif"
			>
				{item.day}
			</text>
		{/each}
		
		<!-- Y-axis labels -->
		{#each Array(5) as _, i}
			{@const value = maxY - (i / 4) * maxY}
			<text
				x={padding.left - 10}
				y={padding.top + (i / 4) * chartHeight + 5}
				text-anchor="end"
				font-size="12"
				fill="#64748b"
				font-family="system-ui, sans-serif"
			>
				{Math.round(value)}
			</text>
		{/each}
	</svg>
</div>
