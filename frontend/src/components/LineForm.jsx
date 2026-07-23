import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function LineForm({ scores }) {
  // scores = [{ parameter_id, score, name, description, weightage }, ...]

  if (!Array.isArray(scores) || scores.length === 0) {
    return null; // or a placeholder like <div>No score data yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
        <p>Scores</p>
      <LineChart data={scores}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={70} />
        <YAxis domain={[0, 5]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default LineForm;