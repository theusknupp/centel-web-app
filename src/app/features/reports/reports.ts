import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Navbar } from '../../shared/components/navbar/navbar';
import { SupabaseService } from '../../core/services/supabase.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [Navbar, CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class ReportsComponent implements OnInit {
  carregando = false;
  
  // Controle do Formulário
  tipoRelatorio: string = 'os_mes';
  mesReferencia: string = ''; 
  dataInicio: string = ''; 
  dataFim: string = '';    
  clienteSelecionado: number | null = null;

  // Dados do Banco
  listaClientes: any[] = [];
  listaOS: any[] = [];

  constructor(private supabaseService: SupabaseService) {}

  ngOnInit() {
    this.carregarClientes();
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    this.mesReferencia = `${ano}-${mes}`;
  }

  async carregarClientes() {
    const { data } = await this.supabaseService.getClient().from('clientes').select('id, nome').order('nome');
    if (data) this.listaClientes = data;
  }

  async gerarRelatorio() {
    this.carregando = true;
    try {
      const { data, error } = await this.supabaseService.getClient().from('ordens_servico').select('*');
      if (error) throw error;
      this.listaOS = data || [];

      this.listaOS = this.listaOS.map(os => {
        const cliente = this.listaClientes.find(c => c.id === os.cliente_id);
        os.cliente_nome = cliente ? cliente.nome : `Desconhecido (${os.cliente_id})`;
        return os;
      });

      const doc = new jsPDF();
      this.desenharCabecalho(doc);

      switch (this.tipoRelatorio) {
        case 'os_mes': this.gerarPDFOsNoMes(doc); break;
        case 'qtd_cliente': this.gerarPDFQtdPorCliente(doc); break;
        case 'faturamento_mes': this.gerarPDFFaturamentoMes(doc); break;
        case 'os_periodo': this.gerarPDFOsPorPeriodo(doc); break;
        case 'dossie_cliente': this.gerarPDFDossieCliente(doc); break;
      }

    } catch (err) {
      alert('Erro ao buscar dados para o relatório.');
      console.error(err);
    } finally {
      this.carregando = false;
    }
  }

  desenharCabecalho(doc: jsPDF) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Centel Audio e Vídeo', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Endereço: R. Teresópolis, 240 - Veneza, Ipatinga - MG, 35164-259', 14, 26);
    doc.text('Telefone: (31) 3822-5413', 14, 31);
    
    doc.setLineWidth(0.5);
    doc.line(14, 35, 196, 35);
  }

  gerarPDFOsNoMes(doc: jsPDF) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório de Ordens de Serviço - Mês: ${this.mesReferencia}`, 14, 45);

    const osFiltradas = this.listaOS.filter(os => {
      const dataOs = os.created_at || os.data_previsao || ''; 
      return dataOs.startsWith(this.mesReferencia);
    });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de OS no período: ${osFiltradas.length}`, 14, 52);

    const corpoTabela = osFiltradas.map(os => [
      `#${os.id}`,
      os.cliente_nome,
      os.equipamento,
      os.status_servico
    ]);

    autoTable(doc, {
      startY: 58,
      head: [['ID', 'Cliente', 'Equipamento', 'Status']],
      body: corpoTabela,
      headStyles: { fillColor: [32, 201, 151] }
    });

    doc.save(`Relatorio_OS_Mes_${this.mesReferencia}.pdf`);
  }

  gerarPDFQtdPorCliente(doc: jsPDF) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Quantitativo de OS por Cliente`, 14, 45);

    const contagem: { [key: string]: number } = {};
    this.listaOS.forEach(os => {
      const nome = os.cliente_nome;
      contagem[nome] = (contagem[nome] || 0) + 1;
    });

    const corpoTabela = Object.keys(contagem).map(nome => [
      nome,
      contagem[nome].toString()
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['Nome do Cliente', 'Quantidade Total de OS']],
      body: corpoTabela,
      headStyles: { fillColor: [32, 201, 151] }
    });

    doc.save(`Relatorio_Qtd_Por_Cliente.pdf`);
  }

  gerarPDFFaturamentoMes(doc: jsPDF) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Relatório Financeiro de Faturamento - Mês: ${this.mesReferencia}`, 14, 45);

    let faturamentoTotal = 0;
    const osFiltradas = this.listaOS.filter(os => {
      const dataOs = os.created_at || os.data_previsao || ''; 
      if (dataOs.startsWith(this.mesReferencia)) {
        faturamentoTotal += Number(os.valor_total) || 0;
        return true;
      }
      return false;
    });

    const corpoTabela = osFiltradas.map(os => [
      `#${os.id}`,
      os.cliente_nome,
      os.status_pagamento || 'Pendente',
      `R$ ${(Number(os.valor_total) || 0).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['ID', 'Cliente', 'Status Pagamento', 'Valor Cobrado']],
      body: corpoTabela,
      headStyles: { fillColor: [32, 201, 151] },
      foot: [['', '', 'FATURAMENTO TOTAL:', `R$ ${faturamentoTotal.toFixed(2)}`]], 
      footStyles: { fillColor: [11, 61, 46], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    doc.save(`Faturamento_${this.mesReferencia}.pdf`);
  }

  gerarPDFOsPorPeriodo(doc: jsPDF) {
    if (!this.dataInicio || !this.dataFim) {
      alert('Preencha a Data Inicial e a Data Final.');
      return;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const dtIni = this.dataInicio.split('-').reverse().join('/');
    const dtFim = this.dataFim.split('-').reverse().join('/');
    doc.text(`Ordens de Serviço por Período: ${dtIni} até ${dtFim}`, 14, 45);

    const osFiltradas = this.listaOS.filter(os => {
      const dataOs = (os.created_at || os.data_previsao || '').substring(0, 10); 
      return dataOs >= this.dataInicio && dataOs <= this.dataFim;
    });

    const corpoTabela = osFiltradas.map(os => [
      `#${os.id}`,
      (os.created_at || os.data_previsao || '').substring(0, 10).split('-').reverse().join('/'), 
      os.cliente_nome,
      os.equipamento,
      os.status_servico
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['ID', 'Data', 'Cliente', 'Equipamento', 'Status']],
      body: corpoTabela,
      headStyles: { fillColor: [32, 201, 151] }
    });

    doc.save(`OS_Periodo_${this.dataInicio}_a_${this.dataFim}.pdf`);
  }

  gerarPDFDossieCliente(doc: jsPDF) {
    if (!this.clienteSelecionado) {
      alert('Selecione um cliente para gerar o dossiê.');
      return;
    }

    const clienteObj = this.listaClientes.find(c => c.id == this.clienteSelecionado);
    const nomeCliente = clienteObj ? clienteObj.nome : 'Desconhecido';

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dossiê de Manutenções - Cliente: ${nomeCliente}`, 14, 45);

    const osFiltradas = this.listaOS.filter(os => os.cliente_id == this.clienteSelecionado);

    const corpoTabela = osFiltradas.map(os => [
      `#${os.id}\nStatus: ${os.status_servico}`, 
      `Eqp: ${os.equipamento}\nMarca: ${os.marca_modelo || '-'}`,
      `Defeito: ${os.relato_cliente || 'N/A'}\nReparo: ${os.atividade_realizada || 'N/A'}`,
      `R$ ${(Number(os.valor_total) || 0).toFixed(2)}\nPag: ${os.status_pagamento || '-'}`
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['OS/Status', 'Equipamento', 'Diagnóstico e Solução', 'Valores']],
      body: corpoTabela,
      headStyles: { fillColor: [32, 201, 151] },
      styles: { cellPadding: 4, fontSize: 9 }, 
      columnStyles: { 
        2: { cellWidth: 80 } 
      }
    });

    doc.save(`Dossie_${nomeCliente}.pdf`);
  }
}