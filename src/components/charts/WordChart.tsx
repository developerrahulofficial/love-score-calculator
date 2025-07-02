import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WordData } from '@/types/chat';

interface WordChartProps {
  data: WordData[];
}

const WordChart = ({ data }: WordChartProps) => {
  const colors = ['#ec4899', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981'];
  
  const topWords = data
    .filter(word => word.word.length > 2) // Filter out short words
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((item, index) => ({
      ...item,
      color: colors[index % colors.length]
    }));

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Word Frequency Analysis</h2>
        <p className="text-gray-600">
          The most used words reveal conversation patterns. Look for positive words and your name! 
        </p>
      </div>
      
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topWords}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="word" 
              stroke="#666"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#666" />
            <Tooltip 
              formatter={(value: number) => [`${value} times`, 'Used']}
              labelFormatter={(word) => `"${word}"`}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {topWords.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {topWords.slice(0, 10).map((word, index) => (
          <span 
            key={`${word.word}-${word.sender}`}
            className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full text-sm"
            style={{ 
              fontSize: `${Math.max(12, Math.min(18, word.count / 2 + 12))}px`
            }}
          >
            {word.word} ({word.count})
          </span>
        ))}
      </div>
    </Card>
  );
};

export default WordChart;
