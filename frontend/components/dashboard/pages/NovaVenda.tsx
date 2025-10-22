import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCartIcon, UserIcon, CreditCardIcon, TrashIcon, PlusIcon, MinusIcon } from '../../icons/Icons';
import { config } from '../../../config/env';

interface LivroVenda {
  id: number;
  isbn: string;
  titulo: string;
  autor: string;
  editora: string;
  preco: number;
  desconto: number;
  quantidade: number;
  tipoEstoque: 'novo' | 'saldo';
  valorTotal: number;
}

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  email?: string;
}

interface Configuracoes {
  descontoPadrao: number;
  tipoEstoquePadrao: 'novo' | 'saldo';
  formaPagamentoPadrao: string;
}

const NovaVenda: React.FC = () => {
  // Estados principais
  const [livros, setLivros] = useState<LivroVenda[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<string>('dinheiro');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    descontoPadrao: 0,
    tipoEstoquePadrao: 'novo',
    formaPagamentoPadrao: 'dinheiro'
  });

  // Estados de caixa
  const [caixaAberto, setCaixaAberto] = useState<boolean | null>(null);
  const [caixaAtual, setCaixaAtual] = useState<any>(null);
  const [verificandoCaixa, setVerificandoCaixa] = useState(true);

  // Estados de modais
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showNovoClienteModal, setShowNovoClienteModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    cpf: '',
    email: ''
  });

  // Refs
  const isbnInputRef = useRef<HTMLInputElement>(null);

  // Função para verificar status do caixa
  const verificarStatusCaixa = async () => {
    try {
      setVerificandoCaixa(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setCaixaAberto(false);
        return;
      }

      const response = await fetch(config.apiUrls.financeiro.caixa.status, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCaixaAberto(data.caixa_aberto || false);
        if (data.caixa_aberto && data.id) {
          setCaixaAtual(data);
        } else {
          setCaixaAtual(null);
        }
      } else {
        setCaixaAberto(false);
        setCaixaAtual(null);
      }
    } catch (error) {
      console.error('Erro ao verificar status do caixa:', error);
      setCaixaAberto(false);
      setCaixaAtual(null);
    } finally {
      setVerificandoCaixa(false);
    }
  };

  // Carregar configurações do localStorage e verificar caixa
  useEffect(() => {
    try {
      const configSalva = localStorage.getItem('lulibros_configuracoes');
      if (configSalva) {
        const config = JSON.parse(configSalva);
        setConfiguracoes({
          descontoPadrao: config.descontoPadrao || 0,
          tipoEstoquePadrao: config.tipoEstoquePadrao || 'novo',
          formaPagamentoPadrao: config.formaPagamentoPadrao || 'dinheiro'
        });
        setFormaPagamento(config.formaPagamentoPadrao || 'dinheiro');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }

    // Verificar status do caixa ao carregar a página
    verificarStatusCaixa();
  }, []);

  // Focar no input de ISBN ao carregar
  useEffect(() => {
    if (isbnInputRef.current) {
      isbnInputRef.current.focus();
    }
  }, []);

  // Hotkeys
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // F2 = Focar no input de ISBN
      if (e.key === 'F2') {
        e.preventDefault();
        if (isbnInputRef.current) {
          isbnInputRef.current.focus();
        }
      }
      // Ctrl + Enter = Finalizar venda
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        finalizarVenda();
      }
      // Ctrl + L = Limpar venda
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        limparVenda();
      }
      // Ctrl + C = Abrir modal de cliente
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        setShowClienteModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Função para buscar livro por ISBN
  const buscarLivro = async (isbn: string): Promise<any> => {
    try {
      const url = config.apiUrls.vendas.buscarLivroPorIsbn(isbn);
      console.log('DEBUG: Buscando livro na URL:', url);
      
      const response = await fetch(url);
      console.log('DEBUG: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('DEBUG: Error response:', errorText);
        throw new Error('Livro não encontrado');
      }
      
      const data = await response.json();
      console.log('DEBUG: Livro encontrado:', data);
      return data;
    } catch (error) {
      console.log('DEBUG: Erro ao buscar livro:', error);
      throw error;
    }
  };

  // Função para verificar estoque disponível
  const verificarEstoque = async (livroId: number, tipoEstoque: 'novo' | 'saldo'): Promise<number> => {
    try {
      const response = await fetch(config.apiUrls.vendas.verificarEstoque(livroId));
      if (!response.ok) {
        return 0;
      }
      const estoque = await response.json();
      const tipoEstoqueCapitalizado = tipoEstoque.charAt(0).toUpperCase() + tipoEstoque.slice(1);
      return estoque[tipoEstoqueCapitalizado] || 0;
    } catch (error) {
      return 0;
    }
  };

  // Função para adicionar livro à venda
  const adicionarLivro = async (isbn: string) => {
    if (!isbn.trim()) return;

    // Verificar se caixa está aberto
    if (!caixaAberto) {
      setError('Caixa fechado. Abra um caixa no módulo Financeiro para realizar vendas.');
      return;
    }

    console.log('DEBUG: Adicionando livro com ISBN:', isbn);
    setIsLoading(true);
    setError(null);

    try {
      // Buscar livro
      console.log('DEBUG: Buscando livro...');
      const livro = await buscarLivro(isbn);
      console.log('DEBUG: Livro encontrado, processando...');
      
      // Verificar estoque do tipo padrão
      let tipoEstoque = configuracoes.tipoEstoquePadrao;
      let estoqueDisponivel = await verificarEstoque(livro.id, tipoEstoque);
      
      // Se não tem estoque do tipo padrão, tentar o outro tipo
      if (estoqueDisponivel === 0) {
        const outroTipo = tipoEstoque === 'novo' ? 'saldo' : 'novo';
        const estoqueOutroTipo = await verificarEstoque(livro.id, outroTipo);
        if (estoqueOutroTipo > 0) {
          tipoEstoque = outroTipo;
          estoqueDisponivel = estoqueOutroTipo;
        } else {
          throw new Error('Livro sem estoque disponível');
        }
      }

      // Buscar preço do tipo de estoque (converter para maiúscula)
      const tipoEstoqueCapitalizado = tipoEstoque.charAt(0).toUpperCase() + tipoEstoque.slice(1);
      const preco = parseFloat(livro.precos?.[tipoEstoqueCapitalizado] || '0');
      
      if (preco === 0) {
        throw new Error('Preço não encontrado para este tipo de estoque');
      }

      // Verificar se já existe na venda
      const livroExistente = livros.find(l => l.isbn === isbn && l.tipoEstoque === tipoEstoque);
      
      if (livroExistente) {
        // Incrementar quantidade se não exceder estoque
        if (livroExistente.quantidade >= estoqueDisponivel) {
          throw new Error('Quantidade excede estoque disponível');
        }
        
        const novaQuantidade = livroExistente.quantidade + 1;
        const novoValorTotal = (preco * (1 - livroExistente.desconto / 100)) * novaQuantidade;
        
        setLivros(prev => prev.map(l => 
          l.isbn === isbn && l.tipoEstoque === tipoEstoque
            ? { ...l, quantidade: novaQuantidade, valorTotal: novoValorTotal }
            : l
        ));
      } else {
        // Adicionar novo livro
        const desconto = tipoEstoque === 'novo' ? configuracoes.descontoPadrao : 0;
        const valorTotal = (preco * (1 - desconto / 100)) * 1;
        
        const novoLivro: LivroVenda = {
          id: livro.id,
          isbn: livro.isbn,
          titulo: livro.titulo,
          autor: livro.autor,
          editora: livro.editora,
          preco: preco,
          desconto: desconto,
          quantidade: 1,
          tipoEstoque: tipoEstoque,
          valorTotal: valorTotal
        };
        
        setLivros(prev => [...prev, novoLivro]);
      }
      
      // Limpar input e focar novamente
      if (isbnInputRef.current) {
        isbnInputRef.current.value = '';
        isbnInputRef.current.focus();
      }
      
    } catch (error: any) {
      setError(error.message);
      // Limpar input e focar novamente
      if (isbnInputRef.current) {
        isbnInputRef.current.value = '';
        isbnInputRef.current.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para atualizar quantidade
  const atualizarQuantidade = async (isbn: string, tipoEstoque: 'novo' | 'saldo', novaQuantidade: number) => {
    if (novaQuantidade < 1) return;
    
    // Buscar o livro atual
    const livroAtual = livros.find(l => l.isbn === isbn && l.tipoEstoque === tipoEstoque);
    if (!livroAtual) return;
    
    // Verificar estoque disponível
    const estoqueDisponivel = await verificarEstoque(livroAtual.id, tipoEstoque);
    
    if (novaQuantidade > estoqueDisponivel) {
      setError(`Quantidade excede estoque disponível (${estoqueDisponivel} unidades)`);
      return;
    }
    
    setLivros(prev => prev.map(l => {
      if (l.isbn === isbn && l.tipoEstoque === tipoEstoque) {
        const valorTotal = (l.preco * (1 - l.desconto / 100)) * novaQuantidade;
        return { ...l, quantidade: novaQuantidade, valorTotal };
      }
      return l;
    }));
  };

  // Função para atualizar desconto
  const atualizarDesconto = (isbn: string, tipoEstoque: 'novo' | 'saldo', novoDesconto: number) => {
    if (novoDesconto < 0 || novoDesconto > 100) return;
    
    setLivros(prev => prev.map(l => {
      if (l.isbn === isbn && l.tipoEstoque === tipoEstoque) {
        const valorTotal = (l.preco * (1 - novoDesconto / 100)) * l.quantidade;
        return { ...l, desconto: novoDesconto, valorTotal };
      }
      return l;
    }));
  };

  // Função para alterar tipo de estoque
  const alterarTipoEstoque = async (isbn: string, tipoAtual: 'novo' | 'saldo', novoTipo: 'novo' | 'saldo') => {
    if (tipoAtual === novoTipo) return;
    
    // Buscar o livro atual
    const livroAtual = livros.find(l => l.isbn === isbn && l.tipoEstoque === tipoAtual);
    if (!livroAtual) return;
    
    // Verificar se já existe um livro com o mesmo ISBN e novo tipo
    const livroExistente = livros.find(l => l.isbn === isbn && l.tipoEstoque === novoTipo);
    
    if (livroExistente) {
      // Se já existe, verificar estoque antes de incrementar
      const estoqueDisponivel = await verificarEstoque(livroAtual.id, novoTipo);
      const novaQuantidade = livroExistente.quantidade + livroAtual.quantidade;
      
      if (novaQuantidade > estoqueDisponivel) {
        setError(`Estoque insuficiente para alterar tipo. Disponível: ${estoqueDisponivel} unidades`);
        return;
      }
      
      // Incrementar a quantidade
      setLivros(prev => prev.map(l => {
        if (l.isbn === isbn && l.tipoEstoque === novoTipo) {
          const valorTotal = (l.preco * (1 - l.desconto / 100)) * novaQuantidade;
          return { ...l, quantidade: novaQuantidade, valorTotal };
        }
        return l;
      }));
      
      // Remover o livro do tipo antigo
      setLivros(prev => prev.filter(l => !(l.isbn === isbn && l.tipoEstoque === tipoAtual)));
    } else {
      // Se não existe, verificar estoque antes de criar novo
      const estoqueDisponivel = await verificarEstoque(livroAtual.id, novoTipo);
      
      if (livroAtual.quantidade > estoqueDisponivel) {
        setError(`Estoque insuficiente para alterar tipo. Disponível: ${estoqueDisponivel} unidades`);
        return;
      }
      
      // Criar novo livro com o novo tipo
      try {
        // Buscar dados do livro novamente para obter preço do novo tipo
        const livro = await buscarLivro(isbn);
        const tipoEstoqueCapitalizado = novoTipo.charAt(0).toUpperCase() + novoTipo.slice(1);
        const novoPreco = parseFloat(livro.precos?.[tipoEstoqueCapitalizado] || '0');
        
        if (novoPreco === 0) {
          setError('Preço não encontrado para este tipo de estoque');
          return;
        }
        
        // Definir desconto baseado no tipo
        const desconto = novoTipo === 'novo' ? configuracoes.descontoPadrao : 0;
        const valorTotal = (novoPreco * (1 - desconto / 100)) * livroAtual.quantidade;
        
        // Atualizar o livro atual
        setLivros(prev => prev.map(l => {
          if (l.isbn === isbn && l.tipoEstoque === tipoAtual) {
            return {
              ...l,
              tipoEstoque: novoTipo,
              preco: novoPreco,
              desconto: desconto,
              valorTotal: valorTotal
            };
          }
          return l;
        }));
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  // Função para remover livro
  const removerLivro = (isbn: string, tipoEstoque: 'novo' | 'saldo') => {
    setLivros(prev => prev.filter(l => !(l.isbn === isbn && l.tipoEstoque === tipoEstoque)));
  };

  // Função para limpar venda
  const limparVenda = () => {
    setLivros([]);
    setCliente(null);
    setError(null);
    if (isbnInputRef.current) {
      isbnInputRef.current.focus();
    }
  };

  // Função para finalizar venda
  const finalizarVenda = async () => {
    if (livros.length === 0) {
      setError('Adicione pelo menos um livro à venda');
      return;
    }

    // Verificar se caixa está aberto
    if (!caixaAberto) {
      setError('Caixa fechado. Abra um caixa no módulo Financeiro para realizar vendas.');
      return;
    }

    console.log('DEBUG: Iniciando finalização da venda...');
    setIsLoading(true);
    setError(null);

    try {
      // Preparar dados da venda
      const vendaData = {
        cliente_id: cliente?.id || null,
        forma_pagamento: formaPagamento === 'dinheiro' ? 'Dinheiro' : 
                        formaPagamento === 'pix' ? 'PIX' :
                        formaPagamento === 'debito' ? 'Débito' :
                        formaPagamento === 'credito' ? 'Crédito' : 'Dinheiro',
        total_venda: totalVenda,
        caixa_id: caixaAtual?.id || null,
        itens: livros.map(livro => ({
          livro_id: livro.id,
          tipo_estoque: livro.tipoEstoque === 'novo' ? 'Novo' : 'Saldo',
          quantidade: livro.quantidade,
          preco_unitario: livro.preco,
          desconto_percentual: livro.desconto,
          total_item: livro.valorTotal
        }))
      };

      console.log('DEBUG: Dados da venda:', vendaData);
      console.log('DEBUG: Campo itens existe?', 'itens' in vendaData);
      console.log('DEBUG: Campo itens é array?', Array.isArray(vendaData.itens));
      console.log('DEBUG: Conteúdo do campo itens:', vendaData.itens);
      console.log('DEBUG: Caixa atual:', caixaAtual);
      console.log('DEBUG: Caixa ID:', vendaData.caixa_id);

      // Obter token de autenticação
      const token = localStorage.getItem('token');
      console.log('DEBUG: Token encontrado:', token ? 'SIM' : 'NÃO');
      console.log('DEBUG: Token completo:', token);
      console.log('DEBUG: Todos os itens do localStorage:', Object.keys(localStorage));
      
      if (!token) {
        throw new Error('Token de autenticação não encontrado. Faça login novamente.');
      }

      const url = config.apiUrls.vendas.finalizar;
      console.log('DEBUG: URL da finalização:', url);

      // Enviar venda para o backend
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(vendaData)
      });

      console.log('DEBUG: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('DEBUG: Erro na resposta:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.log('DEBUG: Erro parseado:', errorData);
          throw new Error(errorData.error || 'Erro ao finalizar venda');
        } catch (parseError) {
          console.log('DEBUG: Erro ao parsear resposta:', parseError);
          throw new Error(`Erro ${response.status}: ${errorText}`);
        }
      }

      const resultText = await response.text();
      console.log('DEBUG: Resultado da venda (texto):', resultText);
      
      let result;
      try {
        result = JSON.parse(resultText);
        console.log('DEBUG: Resultado da venda (JSON):', result);
      } catch (parseError) {
        console.log('DEBUG: Erro ao parsear JSON:', parseError);
        // Se não conseguir parsear como JSON, assumir sucesso se status é 200
        result = { success: true, message: 'Venda finalizada com sucesso', total: totalVenda };
      }
      
      // Limpar venda e mostrar sucesso
      limparVenda();
      alert(`Venda finalizada com sucesso! Total: R$ ${result.total.toFixed(2)}`);
      
    } catch (error: any) {
      console.log('DEBUG: Erro capturado:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para buscar clientes
  const buscarClientes = async (termo: string) => {
    if (!termo.trim()) {
      setClientes([]);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.apiUrls.clientes.listar}?search=${encodeURIComponent(termo)}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClientes(data.clientes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  // Função para cadastrar novo cliente
  const cadastrarCliente = async () => {
    if (!novoCliente.nome.trim() || !novoCliente.cpf.trim()) {
      alert('Nome e CPF são obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(config.apiUrls.clientes.criar, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify(novoCliente)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Verificar se o cliente está em data.cliente ou data diretamente
        const cliente = data.cliente || data;
        
        setCliente(cliente);
        setShowNovoClienteModal(false);
        setNovoCliente({ nome: '', cpf: '', email: '' });
        alert('Cliente cadastrado com sucesso!');
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao cadastrar cliente');
      }
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      alert('Erro ao cadastrar cliente');
    }
  };

  // Função para selecionar cliente
  const selecionarCliente = (cliente: Cliente) => {
    setCliente(cliente);
    setShowClienteModal(false);
    setBuscaCliente('');
    setClientes([]);
  };

  // Calcular totais
  const totalVenda = livros.reduce((sum, l) => sum + l.valorTotal, 0);
  const totalDesconto = livros.reduce((sum, l) => sum + (l.preco * l.quantidade * l.desconto / 100), 0);

  // Se ainda está verificando o caixa, mostrar loading
  if (verificandoCaixa) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando status do caixa...</p>
          </div>
        </div>
      </div>
    );
  }

  // Se caixa está fechado, mostrar interface de bloqueio
  if (!caixaAberto) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShoppingCartIcon className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
                  <p className="text-gray-600">Sistema de vendas com leitor de código de barras</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interface de Caixa Fechado */}
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Caixa Fechado
              </h2>
              
              <p className="text-gray-600 mb-8">
                Para realizar vendas, é necessário abrir um caixa no módulo Financeiro.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">
                      Como abrir o caixa:
                    </h3>
                    <div className="text-blue-800 space-y-2">
                      <p>1. <strong>Clique em "Financeiro"</strong> no menu lateral</p>
                      <p>2. <strong>Clique em "Abrir Caixa"</strong> na página do Financeiro</p>
                      <p>3. <strong>Informe o fundo inicial</strong> e confirme</p>
                      <p>4. <strong>Volte aqui</strong> para realizar vendas</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Dica:</strong> Acesse o módulo Financeiro e clique em "Abrir Caixa" para começar a realizar vendas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ShoppingCartIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
                <p className="text-gray-600">Sistema de vendas com leitor de código de barras</p>
              </div>
            </div>
            
            {/* Status do Caixa */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Caixa Aberto
              </div>
              
              {/* Hotkeys */}
              <div className="text-sm text-gray-500">
                <div className="flex space-x-4">
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded">F2</kbd> Focar ISBN</span>
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + Enter</kbd> Finalizar</span>
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + L</kbd> Limpar</span>
                  <span><kbd className="px-2 py-1 bg-gray-100 rounded">Ctrl + C</kbd> Cliente</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Área Principal - Lista de Livros */}
          <div className="lg:col-span-2">
            {/* Input de ISBN */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-2">
                📱 Escanear ISBN ou digitar código
              </label>
              <div className="flex">
                <input
                  ref={isbnInputRef}
                  id="isbn"
                  type="text"
                  placeholder="Passe o código de barras ou digite o ISBN..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      adicionarLivro(e.currentTarget.value);
                    }
                  }}
                  disabled={isLoading}
                />
                <button
                  onClick={() => {
                    if (isbnInputRef.current) {
                      adicionarLivro(isbnInputRef.current.value);
                    }
                  }}
                  disabled={isLoading}
                  className="px-6 py-3 bg-green-600 text-white rounded-r-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {isLoading ? '⏳' : '➕'}
                </button>
              </div>
              
              {error && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">❌ {error}</p>
                </div>
              )}
            </div>

            {/* Lista de Livros */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  📚 Livros na Venda ({livros.length})
                </h2>
              </div>
              
              {livros.length === 0 ? (
                <div className="p-12 text-center">
                  <ShoppingCartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum livro adicionado</p>
                  <p className="text-gray-400 text-sm">Escaneie um código de barras para começar</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {livros.map((livro, index) => (
                    <div key={`${livro.isbn}-${livro.tipoEstoque}`} className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Informações do Livro */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-500 mr-2">
                              ISBN: {livro.isbn}
                            </span>
                            <select
                              value={livro.tipoEstoque}
                              onChange={(e) => alterarTipoEstoque(livro.isbn, livro.tipoEstoque, e.target.value as 'novo' | 'saldo')}
                              className={`px-2 py-1 text-xs font-medium rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                livro.tipoEstoque === 'novo' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              <option value="novo">🟢 Novo</option>
                              <option value="saldo">🟠 Saldo</option>
                            </select>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {livro.titulo.length > 50 
                              ? `${livro.titulo.substring(0, 50)}...` 
                              : livro.titulo
                            }
                          </h3>
                          
                          <p className="text-sm text-gray-600 mb-3">
                            {livro.autor} • {livro.editora}
                          </p>
                          
                          {/* Preço e Desconto */}
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">Preço:</span>
                              {livro.desconto > 0 ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-400 line-through">
                                    R$ {livro.preco.toFixed(2)}
                                  </span>
                                  <span className="text-lg font-semibold text-green-600">
                                    R$ {(livro.preco * (1 - livro.desconto / 100)).toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-semibold text-gray-900">
                                  R$ {livro.preco.toFixed(2)}
                                </span>
                              )}
                            </div>
                            
                            {/* Input de Desconto */}
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-500">Desconto:</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={livro.desconto}
                                onChange={(e) => atualizarDesconto(livro.isbn, livro.tipoEstoque, parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-500">%</span>
                            </div>
                          </div>
                          
                          {/* Quantidade e Total */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => atualizarQuantidade(livro.isbn, livro.tipoEstoque, livro.quantidade - 1)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <MinusIcon className="w-4 h-4" />
                              </button>
                              <span className="text-sm text-gray-500">Qtd:</span>
                              <input
                                type="number"
                                min="1"
                                value={livro.quantidade}
                                onChange={(e) => atualizarQuantidade(livro.isbn, livro.tipoEstoque, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                              />
                              <button
                                onClick={() => atualizarQuantidade(livro.isbn, livro.tipoEstoque, livro.quantidade + 1)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <PlusIcon className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-green-600">
                                R$ {livro.valorTotal.toFixed(2)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {livro.quantidade} {livro.quantidade === 1 ? 'unidade' : 'unidades'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botão Remover */}
                        <button
                          onClick={() => removerLivro(livro.isbn, livro.tipoEstoque)}
                          className="ml-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Cliente e Finalização */}
          <div className="space-y-6">
            {/* Cliente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <UserIcon className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Cliente</h3>
              </div>
              
              {cliente ? (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-medium text-gray-900">{cliente.nome}</p>
                    <p className="text-sm text-gray-600">CPF: {cliente.cpf}</p>
                    {cliente.email && (
                      <p className="text-sm text-gray-600">{cliente.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setCliente(null)}
                    className="w-full text-sm text-red-600 hover:text-red-700"
                  >
                    Remover cliente
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowClienteModal(true)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    🔍 Buscar cliente existente
                  </button>
                  <button
                    onClick={() => setShowNovoClienteModal(true)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    ➕ Cadastrar novo cliente
                  </button>
                </div>
              )}
            </div>

            {/* Forma de Pagamento */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center mb-4">
                <CreditCardIcon className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Forma de Pagamento</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {['dinheiro', 'pix', 'debito', 'credito', 'outros'].map((forma) => (
                  <button
                    key={forma}
                    onClick={() => setFormaPagamento(forma)}
                    className={`p-3 text-sm font-medium rounded-lg border-2 transition-all ${
                      formaPagamento === forma
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {forma === 'dinheiro' && '💵 Dinheiro'}
                    {forma === 'pix' && '📱 PIX'}
                    {forma === 'debito' && '💳 Débito'}
                    {forma === 'credito' && '💎 Crédito'}
                    {forma === 'outros' && '🔧 Outros'}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumo da Venda */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo da Venda</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">R$ {(totalVenda + totalDesconto).toFixed(2)}</span>
                </div>
                
                {totalDesconto > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto:</span>
                    <span>-R$ {totalDesconto.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">R$ {totalVenda.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={finalizarVenda}
                disabled={livros.length === 0 || isLoading}
                className="w-full mt-6 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳ Finalizando...' : '✅ Finalizar Venda'}
              </button>
              
              <button
                onClick={limparVenda}
                className="w-full mt-2 px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                🗑️ Limpar Venda
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Buscar Cliente */}
        {showClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Buscar Cliente</h3>
              
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Digite nome, CPF ou email..."
                  value={buscaCliente}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value);
                    buscarClientes(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="max-h-60 overflow-y-auto">
                {clientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => selecionarCliente(cliente)}
                    className="p-3 border border-gray-200 rounded-md mb-2 cursor-pointer hover:bg-gray-50"
                  >
                    <p className="font-medium">{cliente.nome}</p>
                    <p className="text-sm text-gray-600">CPF: {cliente.cpf}</p>
                    {cliente.email && (
                      <p className="text-sm text-gray-600">{cliente.email}</p>
                    )}
                  </div>
                ))}
                
                {buscaCliente && clientes.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Nenhum cliente encontrado</p>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setShowClienteModal(false);
                    setBuscaCliente('');
                    setClientes([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Cadastrar Cliente */}
        {showNovoClienteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Cadastrar Novo Cliente</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={novoCliente.nome}
                    onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={novoCliente.cpf}
                    onChange={(e) => setNovoCliente({ ...novoCliente, cpf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={novoCliente.email}
                    onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowNovoClienteModal(false);
                    setNovoCliente({ nome: '', cpf: '', email: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={cadastrarCliente}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Cadastrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NovaVenda;