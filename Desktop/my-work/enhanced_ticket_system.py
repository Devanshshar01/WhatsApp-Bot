
# Enhanced Ticket System Features for Discord Bot
# This extends the existing TicketCog with advanced features

import discord
from discord.ext import commands, tasks
from discord import app_commands
import json
import asyncio
import datetime
from typing import Optional, List
from enum import Enum
import secrets

class TicketPriority(Enum):
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

class TicketStatus(Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    AWAITING_RESPONSE = "awaiting_response"
    ESCALATED = "escalated"
    CLOSED = "closed"

# Enhanced Ticket Configuration
class EnhancedTicketConfig:
    # Priority levels with SLA times (in hours)
    PRIORITY_SLA = {
        "critical": 1,   # 1 hour
        "high": 4,       # 4 hours  
        "medium": 24,    # 24 hours
        "low": 72        # 72 hours
    }

    # Auto-escalation settings
    AUTO_ESCALATE_ENABLED = True
    ESCALATION_WARNING_TIME = 0.75  # Warn at 75% of SLA time

    # Ticket limits
    MAX_TICKETS_PER_USER = 3
    INACTIVITY_CLOSE_HOURS = 48

    # Form questions for different categories
    CATEGORY_FORMS = {
        "technical": [
            {"question": "What device/browser are you using?", "required": True, "max_length": 100},
            {"question": "Describe the issue in detail", "required": True, "max_length": 500, "multiline": True},
            {"question": "What steps did you try to fix it?", "required": False, "max_length": 300}
        ],
        "report": [
            {"question": "Username of the person being reported", "required": True, "max_length": 50},
            {"question": "What rule did they break?", "required": True, "max_length": 200},
            {"question": "Provide evidence (describe or attach)", "required": True, "max_length": 500, "multiline": True}
        ]
    }

class EnhancedTicketCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.setup_enhanced_database()
        self.ticket_reminders.start()
        self.auto_escalation_check.start()

    def setup_enhanced_database(self):
        """Set up enhanced database tables"""
        cursor = self.bot.db_connection.cursor()

        # Enhanced tickets table with new fields
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS enhanced_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT UNIQUE NOT NULL,
            user_id INTEGER NOT NULL,
            channel_id INTEGER,
            category TEXT,
            priority TEXT DEFAULT 'medium',
            status TEXT DEFAULT 'open',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
            sla_deadline DATETIME,
            escalation_level INTEGER DEFAULT 0,
            assigned_to INTEGER,
            escalated_to INTEGER,
            closed_at DATETIME,
            guild_id INTEGER NOT NULL,
            form_responses TEXT,  -- JSON string
            tags TEXT,           -- JSON string
            rating INTEGER,
            feedback TEXT
        )
        ''')

        # Ticket notes table for internal staff notes
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ticket_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            note TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_internal BOOLEAN DEFAULT 1
        )
        ''')

        # Ticket templates table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ticket_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            template_content TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # User blacklist table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS ticket_blacklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            reason TEXT,
            blacklisted_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        # Staff performance tracking
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS staff_performance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id INTEGER NOT NULL,
            staff_id INTEGER NOT NULL,
            tickets_handled INTEGER DEFAULT 0,
            avg_response_time INTEGER DEFAULT 0,
            avg_resolution_time INTEGER DEFAULT 0,
            customer_rating REAL DEFAULT 0.0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        ''')

        self.bot.db_connection.commit()

    @app_commands.command(name="ticket-priority", description="Set ticket priority (Staff only)")
    @app_commands.describe(
        ticket_channel="The ticket channel",
        priority="Priority level"
    )
    async def set_ticket_priority(
        self, 
        interaction: discord.Interaction, 
        ticket_channel: discord.TextChannel,
        priority: str
    ):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ You don't have permission to set ticket priority!", ephemeral=True)
            return

        if priority.lower() not in ["low", "medium", "high", "critical"]:
            await interaction.response.send_message("❌ Invalid priority! Use: low, medium, high, critical", ephemeral=True)
            return

        cursor = self.bot.db_connection.cursor()

        # Calculate new SLA deadline
        sla_hours = EnhancedTicketConfig.PRIORITY_SLA.get(priority.lower(), 24)
        new_deadline = datetime.datetime.utcnow() + datetime.timedelta(hours=sla_hours)

        cursor.execute('''
        UPDATE enhanced_tickets 
        SET priority = ?, sla_deadline = ?, last_activity = CURRENT_TIMESTAMP
        WHERE channel_id = ?
        ''', (priority.lower(), new_deadline, ticket_channel.id))

        if cursor.rowcount == 0:
            await interaction.response.send_message("❌ This is not a valid ticket channel!", ephemeral=True)
            return

        self.bot.db_connection.commit()

        # Create priority update embed
        priority_colors = {
            "low": discord.Color.green(),
            "medium": discord.Color.yellow(), 
            "high": discord.Color.orange(),
            "critical": discord.Color.red()
        }

        embed = discord.Embed(
            title="🔄 Ticket Priority Updated",
            description=f"Priority set to **{priority.upper()}**",
            color=priority_colors.get(priority.lower(), discord.Color.blue())
        )
        embed.add_field(name="📅 New SLA Deadline", value=f"<t:{int(new_deadline.timestamp())}:R>", inline=True)
        embed.add_field(name="👤 Updated by", value=interaction.user.mention, inline=True)

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="ticket-transfer", description="Transfer ticket to another category")
    @app_commands.describe(
        ticket_channel="The ticket channel to transfer",
        new_category="New category for the ticket"
    )
    async def transfer_ticket(
        self, 
        interaction: discord.Interaction,
        ticket_channel: discord.TextChannel,
        new_category: str
    ):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ You don't have permission to transfer tickets!", ephemeral=True)
            return

        valid_categories = ["general", "technical", "report", "partnership", "billing", "other"]
        if new_category.lower() not in valid_categories:
            await interaction.response.send_message(f"❌ Invalid category! Use: {', '.join(valid_categories)}", ephemeral=True)
            return

        cursor = self.bot.db_connection.cursor()
        cursor.execute('''
        UPDATE enhanced_tickets 
        SET category = ?, last_activity = CURRENT_TIMESTAMP
        WHERE channel_id = ?
        ''', (new_category.lower(), ticket_channel.id))

        if cursor.rowcount == 0:
            await interaction.response.send_message("❌ This is not a valid ticket channel!", ephemeral=True)
            return

        self.bot.db_connection.commit()

        # Update channel name
        try:
            user_name = ticket_channel.name.split('-', 1)[1] if '-' in ticket_channel.name else "user"
            new_name = f"{new_category.lower()}-{user_name}"
            await ticket_channel.edit(name=new_name)
        except:
            pass

        embed = discord.Embed(
            title="🔄 Ticket Transferred",
            description=f"Ticket moved to **{new_category.title()}** category",
            color=discord.Color.blue()
        )
        embed.add_field(name="👤 Transferred by", value=interaction.user.mention, inline=True)

        await interaction.response.send_message(embed=embed)

    @app_commands.command(name="ticket-note", description="Add internal note to ticket")
    @app_commands.describe(
        ticket_channel="The ticket channel",
        note="Internal note (only visible to staff)"
    )
    async def add_ticket_note(
        self,
        interaction: discord.Interaction,
        ticket_channel: discord.TextChannel,
        note: str
    ):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ You don't have permission to add ticket notes!", ephemeral=True)
            return

        cursor = self.bot.db_connection.cursor()

        # Get ticket ID
        cursor.execute('SELECT ticket_id FROM enhanced_tickets WHERE channel_id = ?', (ticket_channel.id,))
        result = cursor.fetchone()

        if not result:
            await interaction.response.send_message("❌ This is not a valid ticket channel!", ephemeral=True)
            return

        ticket_id = result[0]

        # Add note
        cursor.execute('''
        INSERT INTO ticket_notes (ticket_id, author_id, note)
        VALUES (?, ?, ?)
        ''', (ticket_id, interaction.user.id, note))

        self.bot.db_connection.commit()

        embed = discord.Embed(
            title="📝 Internal Note Added",
            description="Note added successfully (visible only to staff)",
            color=discord.Color.blue()
        )
        embed.add_field(name="👤 Added by", value=interaction.user.mention, inline=True)
        embed.add_field(name="📄 Note", value=note[:200] + "..." if len(note) > 200 else note, inline=False)

        await interaction.response.send_message(embed=embed, ephemeral=True)

    @app_commands.command(name="ticket-blacklist", description="Blacklist user from creating tickets")
    @app_commands.describe(
        user="User to blacklist",
        reason="Reason for blacklisting"
    )
    async def blacklist_user(
        self,
        interaction: discord.Interaction,
        user: discord.Member,
        reason: str = "No reason provided"
    ):
        if not interaction.user.guild_permissions.manage_guild:
            await interaction.response.send_message("❌ You don't have permission to blacklist users!", ephemeral=True)
            return

        cursor = self.bot.db_connection.cursor()

        # Check if already blacklisted
        cursor.execute('''
        SELECT id FROM ticket_blacklist 
        WHERE guild_id = ? AND user_id = ?
        ''', (interaction.guild_id, user.id))

        if cursor.fetchone():
            await interaction.response.send_message("❌ User is already blacklisted from creating tickets!", ephemeral=True)
            return

        # Add to blacklist
        cursor.execute('''
        INSERT INTO ticket_blacklist (guild_id, user_id, reason, blacklisted_by)
        VALUES (?, ?, ?, ?)
        ''', (interaction.guild_id, user.id, reason, interaction.user.id))

        # Close any open tickets by this user
        cursor.execute('''
        UPDATE enhanced_tickets 
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND guild_id = ? AND status != 'closed'
        ''', (user.id, interaction.guild_id))

        self.bot.db_connection.commit()

        embed = discord.Embed(
            title="🚫 User Blacklisted",
            description=f"{user.mention} has been blacklisted from creating tickets",
            color=discord.Color.red()
        )
        embed.add_field(name="📝 Reason", value=reason, inline=False)
        embed.add_field(name="👤 Blacklisted by", value=interaction.user.mention, inline=True)

        await interaction.response.send_message(embed=embed)

    @tasks.loop(minutes=15)
    async def ticket_reminders(self):
        """Send reminders for tickets approaching SLA deadline"""
        cursor = self.bot.db_connection.cursor()

        # Find tickets approaching deadline (75% of SLA time passed)
        cursor.execute('''
        SELECT ticket_id, channel_id, guild_id, assigned_to, priority, sla_deadline
        FROM enhanced_tickets 
        WHERE status IN ('open', 'in_progress') 
        AND sla_deadline IS NOT NULL 
        AND datetime(sla_deadline) > datetime('now')
        AND datetime(sla_deadline) <= datetime('now', '+' || (
            CASE priority
                WHEN 'critical' THEN '15 minutes'
                WHEN 'high' THEN '1 hour' 
                WHEN 'medium' THEN '6 hours'
                ELSE '18 hours'
            END
        ))
        ''')

        for ticket_id, channel_id, guild_id, assigned_to, priority, sla_deadline in cursor.fetchall():
            guild = self.bot.get_guild(guild_id)
            if not guild:
                continue

            channel = guild.get_channel(channel_id)
            if not channel:
                continue

            deadline_dt = datetime.datetime.fromisoformat(sla_deadline)
            time_left = deadline_dt - datetime.datetime.utcnow()

            embed = discord.Embed(
                title="⏰ SLA Reminder",
                description=f"This ticket is approaching its SLA deadline!",
                color=discord.Color.orange()
            )
            embed.add_field(name="⏳ Time Remaining", value=f"<t:{int(deadline_dt.timestamp())}:R>", inline=True)
            embed.add_field(name="🔥 Priority", value=priority.upper(), inline=True)

            mention_text = ""
            if assigned_to:
                mention_text = f"<@{assigned_to}>"

            await channel.send(mention_text, embed=embed)

    @tasks.loop(hours=1)
    async def auto_escalation_check(self):
        """Check for tickets that need auto-escalation"""
        if not EnhancedTicketConfig.AUTO_ESCALATE_ENABLED:
            return

        cursor = self.bot.db_connection.cursor()

        # Find tickets past SLA deadline
        cursor.execute('''
        SELECT ticket_id, channel_id, guild_id, user_id, priority, escalation_level
        FROM enhanced_tickets 
        WHERE status IN ('open', 'in_progress')
        AND sla_deadline IS NOT NULL 
        AND datetime(sla_deadline) < datetime('now')
        AND escalation_level < 2
        ''')

        for ticket_id, channel_id, guild_id, user_id, priority, escalation_level in cursor.fetchall():
            guild = self.bot.get_guild(guild_id)
            if not guild:
                continue

            channel = guild.get_channel(channel_id)
            if not channel:
                continue

            # Escalate ticket
            new_escalation_level = escalation_level + 1
            cursor.execute('''
            UPDATE enhanced_tickets 
            SET escalation_level = ?, status = 'escalated', last_activity = CURRENT_TIMESTAMP
            WHERE ticket_id = ?
            ''', (new_escalation_level, ticket_id))

            embed = discord.Embed(
                title="⚠️ Ticket Auto-Escalated",
                description=f"This ticket has been automatically escalated (Level {new_escalation_level})",
                color=discord.Color.red()
            )
            embed.add_field(name="📝 Reason", value="SLA deadline exceeded", inline=True)
            embed.add_field(name="🔥 Priority", value=priority.upper(), inline=True)

            # Notify managers/supervisors
            view = EscalationView(ticket_id)
            await channel.send("@here", embed=embed, view=view)

        self.bot.db_connection.commit()

class TicketFormModal(discord.ui.Modal):
    def __init__(self, category: str, questions: List[dict]):
        super().__init__(title=f"Create {category.title()} Ticket")
        self.category = category
        self.responses = {}

        # Add form fields based on questions
        for i, question in enumerate(questions[:5]):  # Discord modal limit is 5 fields
            style = discord.TextStyle.paragraph if question.get("multiline") else discord.TextStyle.short
            field = discord.ui.TextInput(
                label=question["question"],
                required=question["required"],
                max_length=question["max_length"],
                style=style
            )
            self.add_item(field)

    async def on_submit(self, interaction: discord.Interaction):
        # Collect responses
        responses = {}
        for i, item in enumerate(self.children):
            if isinstance(item, discord.ui.TextInput):
                responses[item.label] = item.value

        # Create ticket with form responses
        await self.create_ticket_with_form(interaction, responses)

    async def create_ticket_with_form(self, interaction: discord.Interaction, responses: dict):
        # Check blacklist
        bot = interaction.client
        cursor = bot.db_connection.cursor()

        cursor.execute('''
        SELECT id FROM ticket_blacklist 
        WHERE guild_id = ? AND user_id = ?
        ''', (interaction.guild_id, interaction.user.id))

        if cursor.fetchone():
            await interaction.response.send_message("❌ You are blacklisted from creating tickets!", ephemeral=True)
            return

        # Check ticket limit
        cursor.execute('''
        SELECT COUNT(*) FROM enhanced_tickets 
        WHERE user_id = ? AND guild_id = ? AND status != 'closed'
        ''', (interaction.user.id, interaction.guild_id))

        open_tickets = cursor.fetchone()[0]
        if open_tickets >= EnhancedTicketConfig.MAX_TICKETS_PER_USER:
            await interaction.response.send_message(f"❌ You can only have {EnhancedTicketConfig.MAX_TICKETS_PER_USER} open tickets at a time!", ephemeral=True)
            return

        # Get ticket category from guild settings
        cursor.execute('SELECT ticket_category FROM guild_settings WHERE guild_id = ?', (interaction.guild_id,))
        result = cursor.fetchone()

        if not result or not result[0]:
            await interaction.response.send_message("❌ Ticket system not configured!", ephemeral=True)
            return

        category_channel = interaction.guild.get_channel(result[0])
        if not category_channel:
            await interaction.response.send_message("❌ Ticket category not found!", ephemeral=True)
            return

        # Generate ticket ID and calculate SLA
        ticket_id = f"ticket-{secrets.token_hex(4)}"
        priority = "medium"  # Default priority
        sla_hours = EnhancedTicketConfig.PRIORITY_SLA.get(priority, 24)
        sla_deadline = datetime.datetime.utcnow() + datetime.timedelta(hours=sla_hours)

        # Create ticket channel
        overwrites = {
            interaction.guild.default_role: discord.PermissionOverwrite(read_messages=False),
            interaction.user: discord.PermissionOverwrite(
                read_messages=True, send_messages=True, embed_links=True,
                attach_files=True, read_message_history=True
            ),
            interaction.guild.me: discord.PermissionOverwrite(
                read_messages=True, send_messages=True, manage_messages=True,
                embed_links=True, attach_files=True, read_message_history=True
            )
        }

        try:
            channel = await category_channel.create_text_channel(
                name=f"{self.category}-{interaction.user.name}",
                overwrites=overwrites,
                topic=f"Ticket by {interaction.user} | ID: {ticket_id}"
            )

            # Add to database
            cursor.execute('''
            INSERT INTO enhanced_tickets 
            (ticket_id, user_id, channel_id, category, priority, sla_deadline, guild_id, form_responses)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (ticket_id, interaction.user.id, channel.id, self.category, priority, 
                  sla_deadline, interaction.guild_id, json.dumps(responses)))

            bot.db_connection.commit()

            # Create welcome embed with form responses
            embed = discord.Embed(
                title=f"🎫 {self.category.title()} Ticket Created",
                description=f"Hello {interaction.user.mention}! Thanks for creating a ticket.",
                color=discord.Color.green()
            )

            embed.add_field(name="🆔 Ticket ID", value=f"`{ticket_id}`", inline=True)
            embed.add_field(name="🔥 Priority", value=priority.upper(), inline=True)
            embed.add_field(name="⏰ SLA Deadline", value=f"<t:{int(sla_deadline.timestamp())}:R>", inline=True)

            # Add form responses
            for question, answer in responses.items():
                embed.add_field(name=f"📝 {question}", value=answer[:100] + "..." if len(answer) > 100 else answer, inline=False)

            view = EnhancedTicketControlView(ticket_id)
            await channel.send(f"📢 {interaction.user.mention}", embed=embed, view=view)

            await interaction.response.send_message(
                f"✅ Ticket created successfully! Please head to {channel.mention}",
                ephemeral=True
            )

        except Exception as e:
            await interaction.response.send_message(f"❌ Failed to create ticket: {str(e)}", ephemeral=True)

class EnhancedTicketCreateView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.select(
        placeholder="Select a ticket category...",
        options=[
            discord.SelectOption(label="General Support", description="Get help with general questions", emoji="❓", value="general"),
            discord.SelectOption(label="Technical Support", description="Report bugs or technical issues", emoji="🔧", value="technical"),
            discord.SelectOption(label="Report User", description="Report rule violations", emoji="🚨", value="report"),
            discord.SelectOption(label="Billing Support", description="Payment and billing inquiries", emoji="💳", value="billing"),
            discord.SelectOption(label="Partnership", description="Business partnerships", emoji="🤝", value="partnership")
        ]
    )
    async def select_category(self, interaction: discord.Interaction, select: discord.ui.Select):
        category = select.values[0]

        # Check if category has form questions
        if category in EnhancedTicketConfig.CATEGORY_FORMS:
            questions = EnhancedTicketConfig.CATEGORY_FORMS[category]
            modal = TicketFormModal(category, questions)
            await interaction.response.send_modal(modal)
        else:
            # Create ticket without form
            await self.create_simple_ticket(interaction, category)

    async def create_simple_ticket(self, interaction: discord.Interaction, category: str):
        # Basic ticket creation (similar to existing code but with enhancements)
        # Implementation similar to the form version but without form responses
        pass

class EnhancedTicketControlView(discord.ui.View):
    def __init__(self, ticket_id: str):
        super().__init__(timeout=None)
        self.ticket_id = ticket_id

    @discord.ui.button(label="Close Ticket", style=discord.ButtonStyle.danger, emoji="🔒")
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        # Enhanced close with rating system
        view = TicketCloseView(self.ticket_id)
        embed = discord.Embed(
            title="🔒 Close Ticket",
            description="Are you sure you want to close this ticket?",
            color=discord.Color.red()
        )
        await interaction.response.send_message(embed=embed, view=view, ephemeral=True)

    @discord.ui.button(label="Set Priority", style=discord.ButtonStyle.secondary, emoji="🔥")
    async def set_priority(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ Only staff can set priority!", ephemeral=True)
            return

        view = PrioritySelectView(self.ticket_id)
        await interaction.response.send_message("Select priority level:", view=view, ephemeral=True)

    @discord.ui.button(label="Add Note", style=discord.ButtonStyle.secondary, emoji="📝")
    async def add_note(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ Only staff can add notes!", ephemeral=True)
            return

        modal = AddNoteModal(self.ticket_id)
        await interaction.response.send_modal(modal)

class EscalationView(discord.ui.View):
    def __init__(self, ticket_id: str):
        super().__init__(timeout=300)
        self.ticket_id = ticket_id

    @discord.ui.button(label="Assign to Me", style=discord.ButtonStyle.primary, emoji="👤")
    async def assign_to_me(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.guild_permissions.manage_messages:
            await interaction.response.send_message("❌ Only staff can assign tickets!", ephemeral=True)
            return

        bot = interaction.client
        cursor = bot.db_connection.cursor()

        cursor.execute('''
        UPDATE enhanced_tickets 
        SET assigned_to = ?, status = 'in_progress', last_activity = CURRENT_TIMESTAMP
        WHERE ticket_id = ?
        ''', (interaction.user.id, self.ticket_id))

        bot.db_connection.commit()

        embed = discord.Embed(
            title="👤 Ticket Assigned",
            description=f"{interaction.user.mention} has taken ownership of this escalated ticket",
            color=discord.Color.blue()
        )

        await interaction.response.send_message(embed=embed)

# Additional Modal and View classes would go here...
