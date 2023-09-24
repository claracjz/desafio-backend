const express = require('express');

const { cadastrarUsuario,
    loginUsuario,
    detalharUsuario,
    atualizarUsuario
} = require('../src/controladores/usuarios');

const autenticarUsuario = require('./intermediarios/autenticacao');

const { listarCategorias } = require('../src/controladores/categorias')

const { listarTransacaoUsuario,
    detalharTransacao,
    cadastrarTransacao,
    atualizarTransacao,
    excluirTransacao,
    obterExtrato
} = require('../src/controladores/transacoes')

const rotas = express();

rotas.post('/usuario', cadastrarUsuario)
rotas.post('/login', loginUsuario)

rotas.use(autenticarUsuario)

rotas.get('/usuario', detalharUsuario)
rotas.put('/usuario', atualizarUsuario)
rotas.get('/categoria', listarCategorias)
rotas.get('/transacao/extrato', obterExtrato)
rotas.get('/transacao/:id', detalharTransacao)
rotas.get('/transacao', listarTransacaoUsuario)
rotas.post('/transacao', cadastrarTransacao)
rotas.put('/transacao/:id', atualizarTransacao)
rotas.delete('/transacao/:id', excluirTransacao)

module.exports = rotas
