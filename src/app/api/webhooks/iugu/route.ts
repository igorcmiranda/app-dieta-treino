import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Webhook para receber atualizações da Iugu
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-iugu-signature');
    const payload = await req.text();
    
    // Verificar assinatura do webhook
    const expectedSignature = crypto
      .createHmac('sha1', process.env.IUGU_WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      console.error('[IUGU WEBHOOK] Assinatura inválida');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { event, data } = JSON.parse(payload);
    
    console.log(`[IUGU WEBHOOK] Evento recebido: ${event}`, data);

    switch(event) {
      case 'invoice.created':
        // Nova fatura criada
        console.log('[IUGU WEBHOOK] Nova fatura criada:', data.id);
        await handleInvoiceCreated(data);
        break;
        
      case 'invoice.status_changed':
        // Status da fatura alterado
        console.log('[IUGU WEBHOOK] Status da fatura alterado:', data.status);
        
        if (data.status === 'paid') {
          // Pagamento aprovado - ativar assinatura
          await handlePaymentApproved(data);
        } else if (data.status === 'canceled' || data.status === 'refunded') {
          // Pagamento cancelado/estornado - suspender assinatura
          await handlePaymentFailed(data);
        }
        break;
        
      case 'subscription.suspended':
        // Assinatura suspensa
        console.log('[IUGU WEBHOOK] Assinatura suspensa:', data.id);
        await handleSubscriptionSuspended(data);
        break;
        
      case 'subscription.activated':
        // Assinatura ativada
        console.log('[IUGU WEBHOOK] Assinatura ativada:', data.id);
        await handleSubscriptionActivated(data);
        break;
        
      case 'subscription.created':
        // Nova assinatura criada
        console.log('[IUGU WEBHOOK] Assinatura criada:', data.id);
        await handleSubscriptionCreated(data);
        break;
        
      case 'payment_method.created':
        // Novo método de pagamento adicionado
        console.log('[IUGU WEBHOOK] Método de pagamento criado:', data.id);
        break;
        
      default:
        console.log('[IUGU WEBHOOK] Evento não tratado:', event);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[IUGU WEBHOOK] Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handlers para diferentes eventos
async function handleInvoiceCreated(invoiceData: any) {
  try {
    // Log da nova fatura para auditoria
    console.log('[IUGU WEBHOOK] Fatura criada - ID:', invoiceData.id, 'Valor:', invoiceData.total_cents);
    
    // Aqui você pode:
    // - Enviar email de confirmação para o usuário
    // - Salvar informações da fatura no banco de dados
    // - Notificar sistemas internos
    
    // Buscar user_id nas custom_variables se disponível
    const userIdVar = invoiceData.custom_variables?.find(
      (v: any) => v.name === 'user_id'
    );
    
    if (userIdVar) {
      console.log('[IUGU WEBHOOK] Fatura associada ao usuário:', userIdVar.value);
      // Aqui você pode atualizar o status no localStorage ou banco
    }
  } catch (error) {
    console.error('[IUGU WEBHOOK] Erro ao processar fatura criada:', error);
  }
}

async function handlePaymentApproved(invoiceData: any) {
  try {
    console.log('[IUGU WEBHOOK] Pagamento aprovado - ID:', invoiceData.id);
    
    // Buscar user_id nas custom_variables
    const userIdVar = invoiceData.custom_variables?.find(
      (v: any) => v.name === 'user_id'
    );
    
    if (userIdVar) {
      const userId = userIdVar.value;
      console.log('[IUGU WEBHOOK] Ativando assinatura para usuário:', userId);
      
      // Em um sistema real, você atualizaria o banco de dados
      // Para este projeto, você pode usar uma API interna para atualizar o localStorage
      // ou implementar um sistema de notificação para o frontend
      
      // Exemplo de como você poderia notificar o sistema:
      await notifySubscriptionActivation(userId, invoiceData);
    }
  } catch (error) {
    console.error('[IUGU WEBHOOK] Erro ao processar pagamento aprovado:', error);
  }
}

async function handlePaymentFailed(invoiceData: any) {
  try {
    console.log('[IUGU WEBHOOK] Pagamento falhou - ID:', invoiceData.id, 'Status:', invoiceData.status);
    
    // Buscar user_id e suspender temporariamente
    const userIdVar = invoiceData.custom_variables?.find(
      (v: any) => v.name === 'user_id'
    );
    
    if (userIdVar) {
      const userId = userIdVar.value;
      console.log('[IUGU WEBHOOK] Suspendendo temporariamente usuário:', userId);
      
      // Suspender acesso do usuário temporariamente
      await notifyPaymentFailure(userId, invoiceData);
    }
  } catch (error) {
    console.error('[IUGU WEBHOOK] Erro ao processar falha de pagamento:', error);
  }
}

async function handleSubscriptionSuspended(subscriptionData: any) {
  try {
    console.log('[IUGU WEBHOOK] Assinatura suspensa - ID:', subscriptionData.id);
    
    // Buscar user_id nas custom_variables
    const userIdVar = subscriptionData.custom_variables?.find(
      (v: any) => v.name === 'user_id'
    );
    
    if (userIdVar) {
      const userId = userIdVar.value;
      console.log('[IUGU WEBHOOK] Suspendendo acesso do usuário:', userId);
      
      // Suspender acesso completo do usuário
      await notifySubscriptionSuspension(userId, subscriptionData);
    }
  } catch (error) {
    console.error('[IUGU WEBHOOK] Erro ao processar suspensão da assinatura:', error);
  }
}

async function handleSubscriptionActivated(subscriptionData: any) {
  try {
    console.log('[IUGU WEBHOOK] Assinatura ativada - ID:', subscriptionData.id);
    
    // Buscar user_id nas custom_variables
    const userIdVar = subscriptionData.custom_variables?.find(
      (v: any) => v.name === 'user_id'
    );
    
    if (userIdVar) {
      const userId = userIdVar.value;
      console.log('[IUGU WEBHOOK] Reativando acesso do usuário:', userId);
      
      // Reativar acesso do usuário
      await notifySubscriptionActivation(userId, subscriptionData);
    }
  } catch (error) {
    console.error('[IUGU WEBHOOK] Erro ao processar ativação da assinatura:', error);
  }
}

async function handleSubscriptionCreated(subscriptionData: any) {
  try {
    console.log('[IUGU WEBHOOK] Nova assinatura criada - ID:', subscriptionData.id);
    
    // Buscar user_id nas custom_variables
    const userIdVar = subscriptionData.custom_variables?.find(
      (v: any) => v.name === 'user_id'
    );
    
    if (userIdVar) {
      const userId = userIdVar.value;
      console.log('[IUGU WEBHOOK] Assinatura criada para usuário:', userId);
      
      // Ativar acesso do usuário ao plano
      await notifySubscriptionCreation(userId, subscriptionData);
    }
  } catch (error) {
    console.error('[IUGU WEBHOOK] Erro ao processar criação da assinatura:', error);
  }
}

// Funções auxiliares para notificar o sistema
async function notifySubscriptionActivation(userId: string, data: any) {
  // Em um sistema real, você faria uma chamada para uma API interna
  // ou atualizaria diretamente o banco de dados
  console.log(`[NOTIFICATION] Ativando assinatura para usuário ${userId}`);
  
  // Para este projeto com localStorage, você poderia implementar
  // um endpoint interno para atualizar os dados do usuário
}

async function notifyPaymentFailure(userId: string, data: any) {
  console.log(`[NOTIFICATION] Notificando falha de pagamento para usuário ${userId}`);
  // Implementar lógica de notificação de falha de pagamento
}

async function notifySubscriptionSuspension(userId: string, data: any) {
  console.log(`[NOTIFICATION] Suspendendo usuário ${userId}`);
  // Implementar lógica de suspensão
}

async function notifySubscriptionCreation(userId: string, data: any) {
  console.log(`[NOTIFICATION] Nova assinatura para usuário ${userId}`);
  // Implementar lógica de criação de assinatura
}