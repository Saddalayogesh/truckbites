package com.truckbites.payment.config;

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

    @Value("${app.rabbitmq.queue.order-placed:order.placed.queue}")
    private String orderPlacedQueueName;

    @Value("${app.rabbitmq.routing-key.order-placed:order.placed}")
    private String orderPlacedRoutingKey;

    @Bean
    public TopicExchange truckbitesExchange() {
        return new TopicExchange(exchangeName);
    }

    @Bean
    public Queue orderPlacedQueue() {
        return new Queue(orderPlacedQueueName, true);
    }

    @Bean
    public Binding orderPlacedBinding(Queue orderPlacedQueue, TopicExchange truckbitesExchange) {
        return BindingBuilder
                .bind(orderPlacedQueue)
                .to(truckbitesExchange)
                .with(orderPlacedRoutingKey);
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
