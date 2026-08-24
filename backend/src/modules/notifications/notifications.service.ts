import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { Notification } from './entities/notification.entity';
import { PushSubscription } from './entities/push-subscription.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(PushSubscription)
    private readonly subscriptionRepo: Repository<PushSubscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    webpush.setVapidDetails(
      this.configService.getOrThrow<string>('VAPID_SUBJECT'),
      this.configService.getOrThrow<string>('VAPID_PUBLIC_KEY'),
      this.configService.getOrThrow<string>('VAPID_PRIVATE_KEY'),
    );
  }

  private async resolveUserId(cognitoSub: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { cognitoSub } });
    if (!user) {
      throw new BadRequestException('No user found for this identity');
    }
    return user.id;
  }

  getPublicKey(): string {
    return this.configService.getOrThrow<string>('VAPID_PUBLIC_KEY');
  }

  async subscribe(cognitoSub: string, dto: SubscribeDto): Promise<void> {
    const userId = await this.resolveUserId(cognitoSub);

    const existing = await this.subscriptionRepo.findOne({
      where: { endpoint: dto.endpoint },
    });
    if (existing) {
      existing.userId = userId;
      existing.p256dhKey = dto.keys.p256dh;
      existing.authKey = dto.keys.auth;
      await this.subscriptionRepo.save(existing);
      return;
    }

    const subscription = this.subscriptionRepo.create({
      userId,
      endpoint: dto.endpoint,
      p256dhKey: dto.keys.p256dh,
      authKey: dto.keys.auth,
    });
    await this.subscriptionRepo.save(subscription);
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subscriptionRepo.delete({ endpoint });
  }

  async findMyNotifications(cognitoSub: string): Promise<Notification[]> {
    const userId = await this.resolveUserId(cognitoSub);
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markRead(cognitoSub: string, id: string): Promise<void> {
    const userId = await this.resolveUserId(cognitoSub);
    await this.notificationRepo.update({ id, userId }, { isRead: true });
  }

  async markAllRead(cognitoSub: string): Promise<void> {
    const userId = await this.resolveUserId(cognitoSub);
    await this.notificationRepo.update({ userId, isRead: false }, { isRead: true });
  }

  private async sendPushToUser(
    userId: string,
    title: string,
    body: string,
  ): Promise<void> {
    const subscriptions = await this.subscriptionRepo.find({ where: { userId } });

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dhKey, auth: sub.authKey },
          },
          JSON.stringify({ title, body }),
        );
      } catch (err: any) {
        this.logger.error(`Push failed for subscription ${sub.id}: ${err.message}`);
        if (err.statusCode === 404 || err.statusCode === 410) {
          await this.subscriptionRepo.delete({ id: sub.id });
        }
      }
    }
  }

  async notifyLowStock(
    productName: string,
    warehouseName: string,
    quantityOnHand: number,
    productId: string,
    warehouseId: string,
  ): Promise<void> {
    const recipients = await this.userRepo.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.MANAGER }],
    });

    const message = `${productName} is low in ${warehouseName}: only ${quantityOnHand} left.`;

    for (const user of recipients) {
      const notification = this.notificationRepo.create({
        userId: user.id,
        type: 'low_stock',
        message,
        productId,
        warehouseId,
      });
      await this.notificationRepo.save(notification);
      await this.sendPushToUser(user.id, 'Low stock alert', message);
    }
  }
}
