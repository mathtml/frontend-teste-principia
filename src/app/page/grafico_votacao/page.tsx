"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label,
} from "recharts";
import dotenv from 'dotenv';


interface Pesquisa {
  id: number;
  idPesquisa: string;
  candidato: string;
  resultado: string;
  dataPesquisa: string;
  created_at: string;
}

dotenv.config();

export default function BasicLineChart() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);

  const fetchPesquisas = async () => {
    try {
      const response = await axios.get(`http://107.20.67.182:3000/pesquisas`);
      const data = await response.data;
      setPesquisas(data);
    } catch (error) {
      console.error("Erro ao buscar pesquisas", error);
    }
  };

  useEffect(() => {
    fetchPesquisas();
  }, []);

  const formatarData = (data: string) => {
    const date = new Date(data);
    date.setDate(date.getDate() + 1);
    return new Intl.DateTimeFormat("pt-BR").format(date);
  };

  const dadosAgrupados: { [key: string]: { [candidato: string]: number } } = {};

  pesquisas.forEach((pesquisa) => {
    const dataFormatted = formatarData(pesquisa.dataPesquisa);
    const resultado = parseFloat(
      pesquisa.resultado.replace("%", "").replace(",", ".")
    );

    if (!dadosAgrupados[dataFormatted]) {
      dadosAgrupados[dataFormatted] = {};
    }
    dadosAgrupados[dataFormatted][pesquisa.candidato] = resultado;
  });

  const seriesData = Object.keys(dadosAgrupados).map((data) => {
    return {
      data,
      A: dadosAgrupados[data]["A"] || 0,
      B: dadosAgrupados[data]["B"] || 0,
    };
  });

  const formatarPorcentagem = (valor: number) => {
    return `${valor.toFixed(2)}% dos votos`;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      <h1 style={{ marginBottom: "20px", textAlign: "center" }}>
        Gráfico para eleição presidencial
      </h1>
      <ResponsiveContainer width="50%" height={400}>
        <LineChart
          data={seriesData}
          margin={{ top: 50, right: 30, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="data" />
          <YAxis
            tickFormatter={formatarPorcentagem}
            domain={[0, "dataMax + 20"]}
            ticks={[20, 50, 80]}
          />
          <Tooltip formatter={(value: any) => `${value.toFixed(2)}% dos votos`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="A"
            stroke="#8884d8"
            name="Candidato A"
          />
          <Line
            type="monotone"
            dataKey="B"
            stroke="#82ca9d"
            name="Candidato B"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
