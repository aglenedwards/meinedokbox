import { db } from "../db";
import { accounts, accountMembers, entitlements, invites } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export class AccountService {
  /**
   * Get total available seats for an account
   * total_seats = base_seats + addon_seats
   */
  async getTotalSeats(accountId: string): Promise<number> {
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!account) {
      throw new Error("Account not found");
    }

    const baseSeats = account.baseSeats || 2;

    const addonSeatsEntitlement = await db.query.entitlements.findFirst({
      where: and(
        eq(entitlements.accountId, accountId),
        eq(entitlements.key, "addon_seats")
      ),
    });

    const addonSeats = addonSeatsEntitlement?.valueInt || 0;

    return baseSeats + addonSeats;
  }

  /**
   * Get number of used seats
   * used_seats = count of account_members
   */
  async getUsedSeats(accountId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(accountMembers)
      .where(eq(accountMembers.accountId, accountId));

    return result[0]?.count || 0;
  }

  /**
   * Check if account can invite more members
   */
  async canInviteMore(accountId: string): Promise<boolean> {
    const totalSeats = await this.getTotalSeats(accountId);
    const usedSeats = await this.getUsedSeats(accountId);
    
    // Count pending invites
    const pendingInvites = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invites)
      .where(
        and(
          eq(invites.accountId, accountId),
          eq(invites.status, "pending")
        )
      );
    
    const pendingCount = pendingInvites[0]?.count || 0;

    return (usedSeats + pendingCount) < totalSeats;
  }

  /**
   * Get account for a user (as owner or member)
   */
  async getAccountByUserId(userId: string): Promise<string | null> {
    const membership = await db.query.accountMembers.findFirst({
      where: eq(accountMembers.userId, userId),
    });

    return membership?.accountId || null;
  }

  /**
   * Get account details with seats info
   */
  async getAccountDetails(accountId: string) {
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!account) {
      return null;
    }

    const totalSeats = await this.getTotalSeats(accountId);
    const usedSeats = await this.getUsedSeats(accountId);

    const members = await db.query.accountMembers.findMany({
      where: eq(accountMembers.accountId, accountId),
    });

    const pendingInvites = await db.query.invites.findMany({
      where: and(
        eq(invites.accountId, accountId),
        eq(invites.status, "pending")
      ),
    });

    return {
      ...account,
      totalSeats,
      usedSeats,
      availableSeats: totalSeats - usedSeats,
      members,
      pendingInvites,
    };
  }

  /**
   * Check if user is owner of account
   */
  async isAccountOwner(userId: string, accountId: string): Promise<boolean> {
    const membership = await db.query.accountMembers.findFirst({
      where: and(
        eq(accountMembers.userId, userId),
        eq(accountMembers.accountId, accountId),
        eq(accountMembers.role, "owner")
      ),
    });

    return !!membership;
  }

  /**
   * Check if user has access to account (owner or member)
   */
  async hasAccountAccess(userId: string, accountId: string): Promise<boolean> {
    const membership = await db.query.accountMembers.findFirst({
      where: and(
        eq(accountMembers.userId, userId),
        eq(accountMembers.accountId, accountId)
      ),
    });

    return !!membership;
  }

  /**
   * Add addon seats to account
   */
  async addAddonSeats(accountId: string, additionalSeats: number): Promise<void> {
    const existing = await db.query.entitlements.findFirst({
      where: and(
        eq(entitlements.accountId, accountId),
        eq(entitlements.key, "addon_seats")
      ),
    });

    if (existing) {
      const currentAddon = existing.valueInt || 0;
      await db
        .update(entitlements)
        .set({ 
          valueInt: currentAddon + additionalSeats,
          updatedAt: new Date()
        })
        .where(eq(entitlements.id, existing.id));
    } else {
      await db.insert(entitlements).values({
        accountId,
        key: "addon_seats",
        valueInt: additionalSeats,
      });
    }
  }
}
