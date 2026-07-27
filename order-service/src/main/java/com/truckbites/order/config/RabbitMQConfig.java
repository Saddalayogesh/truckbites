package com.truckbites.order.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.exchange:truckbites.exchange}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue.order-paid:order.paid.queue}")
    private String orderPaidQueueName;

    @Value("${app.rabbitmq.routing-key.order-paid:order.paid}")
    private String orderPaidRoutingKey;

    @Bean
    public TopicExchange truckbitesExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Queue orderPaidQueue() {
        return new Queue(orderPaidQueueName, true);
    }

    @Bean
    public Binding orderPaidBinding(Queue orderPaidQueue, TopicExchange truckbitesExchange) {
        return BindingBuilder
                .bind(orderPaidQueue)
                .to(truckbitesExchange)
                .with(orderPaidRoutingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    /**
     * Configures the RabbitTemplate to use JSON serialization so events
     * can be deserialized across services with differing package structures.
     */
    @Bean
    public RabbitTemplate rabbitTemplate(org.springframework.amqp.rabbit.connection.ConnectionFactory connectionFactory,
                                          MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
