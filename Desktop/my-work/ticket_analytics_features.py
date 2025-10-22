
# Advanced Ticket Analytics and Reporting System

import discord
from discord.ext import commands
from discord import app_commands
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta
import sqlite3
import io
import base64

class TicketAnalyticsCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="ticket-analytics", description="View detailed ticket analytics")
    @app_commands.describe(
        timeframe="Time period to analyze (7d, 30d, 90d)",
        staff_member="Optional: Analyze specific staff member"
    )
    async def ticket_analytics(
        self, 
        interaction: discord.Interaction, 
        timeframe: str = "30d",
        staff_member: discord.Member = None
    ):
        if not interaction.user.guild_permissions.manage_guild:
            await interaction.response.send_message("❌ You need Manage Server permission to view analytics!", ephemeral=True)
            return

        # Parse timeframe
        days_map = {"7d": 7, "30d": 30, "90d": 90}
        days = days_map.get(timeframe, 30)
        start_date = datetime.utcnow() - timedelta(days=days)

        cursor = self.bot.db_connection.cursor()

        # Get basic statistics
        if staff_member:
            cursor.execute('''
            SELECT 
                COUNT(*) as total_tickets,
                AVG(CASE WHEN closed_at IS NOT NULL THEN 
                    (julianday(closed_at) - julianday(created_at)) * 24 
                END) as avg_resolution_hours,
                AVG(rating) as avg_rating,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
                COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_tickets
            FROM enhanced_tickets 
            WHERE guild_id = ? AND assigned_to = ? 
            AND created_at >= datetime(?, 'unixepoch')
            ''', (interaction.guild_id, staff_member.id, start_date.timestamp()))
        else:
            cursor.execute('''
            SELECT 
                COUNT(*) as total_tickets,
                AVG(CASE WHEN closed_at IS NOT NULL THEN 
                    (julianday(closed_at) - julianday(created_at)) * 24 
                END) as avg_resolution_hours,
                AVG(rating) as avg_rating,
                COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets,
                COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_tickets
            FROM enhanced_tickets 
            WHERE guild_id = ? AND created_at >= datetime(?, 'unixepoch')
            ''', (interaction.guild_id, start_date.timestamp()))

        stats = cursor.fetchone()

        # Create analytics embed
        embed = discord.Embed(
            title="📊 Ticket Analytics Report",
            description=f"Analysis for the last {days} days",
            color=discord.Color.blue(),
            timestamp=datetime.utcnow()
        )

        if staff_member:
            embed.description += f" - {staff_member.display_name}"

        embed.add_field(name="🎫 Total Tickets", value=str(stats[0] or 0), inline=True)
        embed.add_field(name="✅ Closed Tickets", value=str(stats[3] or 0), inline=True)
        embed.add_field(name="🔥 Critical Tickets", value=str(stats[4] or 0), inline=True)

        resolution_time = stats[1]
        if resolution_time:
            embed.add_field(name="⏱️ Avg Resolution Time", 
                          value=f"{resolution_time:.1f} hours", inline=True)
        else:
            embed.add_field(name="⏱️ Avg Resolution Time", value="N/A", inline=True)

        rating = stats[2]
        if rating:
            stars = "⭐" * int(rating)
            embed.add_field(name="🌟 Avg Rating", value=f"{rating:.1f}/5 {stars}", inline=True)
        else:
            embed.add_field(name="🌟 Avg Rating", value="N/A", inline=True)

        # Get category breakdown
        cursor.execute('''
        SELECT category, COUNT(*) as count 
        FROM enhanced_tickets 
        WHERE guild_id = ? AND created_at >= datetime(?, 'unixepoch')
        GROUP BY category ORDER BY count DESC LIMIT 5
        ''', (interaction.guild_id, start_date.timestamp()))

        categories = cursor.fetchall()
        if categories:
            category_text = "\n".join([f"• **{cat[0].title()}**: {cat[1]}" for cat in categories])
            embed.add_field(name="📂 Top Categories", value=category_text, inline=False)

        # Get daily ticket volume for the last 7 days
        cursor.execute('''
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM enhanced_tickets 
        WHERE guild_id = ? AND created_at >= datetime(?, 'unixepoch')
        GROUP BY DATE(created_at)
        ORDER BY date DESC LIMIT 7
        ''', (interaction.guild_id, (datetime.utcnow() - timedelta(days=7)).timestamp()))

        daily_data = cursor.fetchall()
        if daily_data:
            daily_text = "\n".join([f"• {date}: {count} tickets" for date, count in daily_data[:5]])
            embed.add_field(name="📈 Daily Volume (Last 7 Days)", value=daily_text, inline=False)

        await interaction.response.send_message(embed=embed)

class TicketTemplatesCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @app_commands.command(name="ticket-template-create", description="Create a ticket response template")
    @app_commands.describe(
        name="Template name",
        content="Template content (use {user} for mentions)",
        category="Category this template applies to"
    )
    async def create_template(
        self, 
        interaction: discord.Interaction, 
        name: str,
        content: str,
        category: str = "general"
    ):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ You need Manage Messages permission to create templates!", ephemeral=True)
            return

        cursor = self.bot.db_connection.cursor()

        # Check if template already exists
        cursor.execute('''
        SELECT id FROM ticket_templates 
        WHERE guild_id = ? AND name = ?
        ''', (interaction.guild_id, name))

        if cursor.fetchone():
            await interaction.response.send_message("❌ A template with this name already exists!", ephemeral=True)
            return

        # Create template
        cursor.execute('''
        INSERT INTO ticket_templates (guild_id, name, category, template_content, created_by)
        VALUES (?, ?, ?, ?, ?)
        ''', (interaction.guild_id, name, category, content, interaction.user.id))

        self.bot.db_connection.commit()

        embed = discord.Embed(
            title="📝 Template Created",
            description=f"Template **{name}** has been created successfully!",
            color=discord.Color.green()
        )
        embed.add_field(name="📂 Category", value=category.title(), inline=True)
        embed.add_field(name="👤 Created by", value=interaction.user.mention, inline=True)
        embed.add_field(name="📄 Preview", value=content[:200] + "..." if len(content) > 200 else content, inline=False)

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="ticket-template-use", description="Use a ticket response template")
    @app_commands.describe(
        template_name="Name of the template to use",
        target_user="User to mention in the template"
    )
    async def use_template(
        self, 
        interaction: discord.Interaction,
        template_name: str,
        target_user: discord.Member = None
    ):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ You need Manage Messages permission to use templates!", ephemeral=True)
            return

        cursor = self.bot.db_connection.cursor()
        cursor.execute('''
        SELECT template_content FROM ticket_templates 
        WHERE guild_id = ? AND name = ?
        ''', (interaction.guild_id, template_name))

        result = cursor.fetchone()
        if not result:
            await interaction.response.send_message("❌ Template not found!", ephemeral=True)
            return

        content = result[0]

        # Replace placeholders
        if target_user:
            content = content.replace("{user}", target_user.mention)
        content = content.replace("{staff}", interaction.user.mention)
        content = content.replace("{server}", interaction.guild.name)

        await interaction.response.send_message(content)

class TicketAutomationCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.setup_automation_tasks()

    def setup_automation_tasks(self):
        @tasks.loop(hours=24)
        async def daily_ticket_cleanup():
            """Close inactive tickets daily"""
            cursor = self.bot.db_connection.cursor()

            # Find tickets inactive for more than configured hours
            inactive_threshold = datetime.utcnow() - timedelta(hours=48)

            cursor.execute('''
            SELECT ticket_id, channel_id, guild_id, user_id
            FROM enhanced_tickets 
            WHERE status IN ('open', 'awaiting_response')
            AND last_activity < ?
            AND created_at < datetime('now', '-48 hours')
            ''', (inactive_threshold,))

            for ticket_id, channel_id, guild_id, user_id in cursor.fetchall():
                guild = self.bot.get_guild(guild_id)
                if not guild:
                    continue

                channel = guild.get_channel(channel_id)
                if not channel:
                    continue

                # Close the ticket
                cursor.execute('''
                UPDATE enhanced_tickets 
                SET status = 'closed', closed_at = CURRENT_TIMESTAMP
                WHERE ticket_id = ?
                ''', (ticket_id,))

                # Send closure message
                embed = discord.Embed(
                    title="🔒 Ticket Auto-Closed",
                    description="This ticket has been automatically closed due to inactivity.",
                    color=discord.Color.orange()
                )
                embed.add_field(name="📝 Reason", value="No activity for 48+ hours", inline=True)
                embed.add_field(name="🔄 Reopen", value="Contact staff to reopen if needed", inline=True)

                await channel.send(embed=embed)

                # Delete channel after 5 minutes
                await asyncio.sleep(300)
                try:
                    await channel.delete(reason="Auto-closed inactive ticket")
                except:
                    pass

            self.bot.db_connection.commit()

        @daily_ticket_cleanup.before_loop
        async def before_cleanup():
            await self.bot.wait_until_ready()

        daily_ticket_cleanup.start()

# Customer Satisfaction System
class TicketFeedbackView(discord.ui.View):
    def __init__(self, ticket_id: str):
        super().__init__(timeout=None)
        self.ticket_id = ticket_id

    @discord.ui.button(label="⭐", style=discord.ButtonStyle.secondary)
    async def rate_1(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process_rating(interaction, 1)

    @discord.ui.button(label="⭐⭐", style=discord.ButtonStyle.secondary) 
    async def rate_2(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process_rating(interaction, 2)

    @discord.ui.button(label="⭐⭐⭐", style=discord.ButtonStyle.secondary)
    async def rate_3(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process_rating(interaction, 3)

    @discord.ui.button(label="⭐⭐⭐⭐", style=discord.ButtonStyle.primary)
    async def rate_4(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process_rating(interaction, 4)

    @discord.ui.button(label="⭐⭐⭐⭐⭐", style=discord.ButtonStyle.success)
    async def rate_5(self, interaction: discord.Interaction, button: discord.ui.Button):
        await self.process_rating(interaction, 5)

    async def process_rating(self, interaction: discord.Interaction, rating: int):
        bot = interaction.client
        cursor = bot.db_connection.cursor()

        # Update ticket rating
        cursor.execute('''
        UPDATE enhanced_tickets 
        SET rating = ?, last_activity = CURRENT_TIMESTAMP
        WHERE ticket_id = ?
        ''', (rating, self.ticket_id))

        bot.db_connection.commit()

        embed = discord.Embed(
            title="🌟 Thank you for your feedback!",
            description=f"You rated this support experience: {'⭐' * rating}",
            color=discord.Color.green()
        )

        # Ask for additional feedback if rating is low
        if rating <= 3:
            modal = FeedbackModal(self.ticket_id, rating)
            await interaction.response.send_modal(modal)
        else:
            await interaction.response.send_message(embed=embed, ephemeral=True)

        # Disable all buttons
        for item in self.children:
            item.disabled = True
        await interaction.edit_original_response(view=self)

class FeedbackModal(discord.ui.Modal):
    def __init__(self, ticket_id: str, rating: int):
        super().__init__(title="Additional Feedback")
        self.ticket_id = ticket_id
        self.rating = rating

    feedback = discord.ui.TextInput(
        label="How can we improve our support?",
        style=discord.TextStyle.paragraph,
        placeholder="Please let us know how we can better assist you in the future...",
        required=False,
        max_length=500
    )

    async def on_submit(self, interaction: discord.Interaction):
        bot = interaction.client
        cursor = bot.db_connection.cursor()

        # Save feedback
        cursor.execute('''
        UPDATE enhanced_tickets 
        SET feedback = ?
        WHERE ticket_id = ?
        ''', (self.feedback.value, self.ticket_id))

        bot.db_connection.commit()

        embed = discord.Embed(
            title="💬 Feedback Received",
            description="Thank you for taking the time to provide feedback. We'll use this to improve our support!",
            color=discord.Color.blue()
        )

        await interaction.response.send_message(embed=embed, ephemeral=True)
