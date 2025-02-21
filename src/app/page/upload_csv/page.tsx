'use client';
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { LinearProgress, Box, Button, Typography, Paper } from "@mui/material"; 
import { toast, ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa"; // Importando os ícones
import axios from "axios";

interface Votos {
  A: number;
  B: number;
}

interface RespostaBackend {
  votosPorMunicipio: Record<string, Votos>;
  votosPorEstado: Record<string, Votos>;
  vencedorNacional: string;
  porcentagemVencedorNacional: number;
  SegundoColocado: string;
  porcentagemSegundoVencedorNacional: number;
}

const UploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [excelData, setExcelData] = useState<RespostaBackend | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const exportToExcel = (data: RespostaBackend) => {
    const { votosPorMunicipio, votosPorEstado, vencedorNacional, porcentagemVencedorNacional, SegundoColocado, porcentagemSegundoVencedorNacional } = data;

    const municipiosSheet = XLSX.utils.json_to_sheet(
      Object.entries(votosPorMunicipio).map(([municipio, votos]) => ({
        Município: municipio,
        Votos_B: votos.B || 0,
        Votos_A: votos.A || 0,
      }))
    );

    const estadosSheet = XLSX.utils.json_to_sheet(
      Object.entries(votosPorEstado).map(([estado, votos]) => ({
        Estado: estado,
        Votos_B: votos.B || 0,
        Votos_A: votos.A || 0,
      }))
    );

    const nacionalSheet = XLSX.utils.json_to_sheet([
      { 
        "Vencedor Nacional": vencedorNacional, 
        "Porcentagem Vencedor Nacional": porcentagemVencedorNacional, 
        "Segundo Colocado": SegundoColocado, 
        "Porcentagem Segundo Colocado": porcentagemSegundoVencedorNacional 
      }
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, municipiosSheet, "Votos por Município");
    XLSX.utils.book_append_sheet(workbook, estadosSheet, "Votos por Estado");
    XLSX.utils.book_append_sheet(workbook, nacionalSheet, "Resultado Nacional");

    XLSX.writeFile(workbook, "resultado.xlsx");
  };

  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo para upload!");

    const formData = new FormData();
    formData.append("arquivo", file);

    const loadingToast = toast.loading("Carregando...", { autoClose: 3000 });

    try {
      const response = await axios.post<RespostaBackend>("http://107.20.67.182:3000/processar-votos", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (response.data) {
        setExcelData(response.data);

        toast.update(loadingToast, {
          render: "Arquivo enviado com sucesso!",
          type: "success",
          autoClose: 3000,
          icon: <FaCheckCircle color="green" />, 
          closeButton: true, 
        });
      } else {
        toast.update(loadingToast, {
          render: "Erro: Resposta inesperada do servidor.",
          type: "error",
          autoClose: 3000,
          icon: <FaTimesCircle color="red" />, 
          closeButton: true, 
        });
      }
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast.update(loadingToast, {
        render: "Erro ao fazer upload do arquivo.",
        type: "error",
        autoClose: 3000,
        icon: <FaTimesCircle color="red" />, 
        closeButton: true, 
      });
    } finally {
      setUploadProgress(0);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f4" }}>
      <Paper sx={{ padding: 4, textAlign: "center", boxShadow: 3 }}>
        <Typography variant="h4" gutterBottom>
          Envio de CSV
        </Typography>
        <input type="file" accept=".csv" onChange={handleFileChange} style={{ marginBottom: "20px", width: "100%" }} />
        <Box sx={{ marginBottom: 2 }}>
          <Button variant="contained" color="primary" onClick={handleUpload} disabled={!file} sx={{ width: "100%", padding: "12px" }}>
            Enviar
          </Button>
        </Box>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <Box sx={{ width: "100%", marginTop: "20px" }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {excelData && (
          <Box sx={{ marginTop: "20px" }}>
            <Button variant="contained" color="success" onClick={() => exportToExcel(excelData)} sx={{ width: "100%", padding: "12px" }}>
              Baixar Excel
            </Button>
          </Box>
        )}
      </Paper>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar closeOnClick closeButton />
    </Box>
  );
};

export default UploadPage;
