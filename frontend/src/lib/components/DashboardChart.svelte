<script lang="ts">
	import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
	
	let { data } = $props<{ data: Array<{ day: string; credits: number }> }>();
</script>

<div class="h-80">
	<ResponsiveContainer width="100%" height="100%">
		<LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
			<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
			<XAxis 
				dataKey="day" 
				stroke="#64748b"
				fontSize={12}
			/>
			<YAxis 
				stroke="#64748b"
				fontSize={12}
			/>
			<Tooltip />
			<Line 
				type="monotone" 
				dataKey="credits" 
				stroke="#22c55e" 
				strokeWidth={3}
				dot={{ fill: '#22c55e', strokeWidth: 2, r: 6 }}
				activeDot={{ r: 8, stroke: '#22c55e', strokeWidth: 2 }}
			/>
		</LineChart>
	</ResponsiveContainer>
</div>
