/**
 * LoginPage - Authentication page with login/signup tabs
 * First screen where users login or create an account
 */

import { BasePage } from './BasePage';
import { Input } from '@ui/components/Input';
import { Button } from '@ui/components/Button';
import { Card } from '@ui/components/Card';
import { Router } from '@/router';
import { stateManager } from '@core/StateManager';
import { ROUTES } from '@core/constants';
import { authService } from '@services/AuthService';
import { appwriteClient } from '@network/AppwriteClient';
import { ThemeName } from '@config/themes';

type Tab = 'login' | 'signup';

export class LoginPage extends BasePage {
	private currentTab: Tab = 'login';
	private emailInput!: Input;
	private passwordInput!: Input;
	private nameInput!: Input;
	private confirmPasswordInput!: Input;
	private submitButton!: Button;
	private cardElement!: HTMLElement;
	private formContainer!: HTMLDivElement;

	public render(): void {
		this.element.className = 'page min-h-screen w-full bg-gradient-to-b from-white to-gray-50 flex items-center justify-center p-6 overflow-y-auto';

		const card = new Card({
			variant: 'glassmorphic',
			padding: 'large',
		});
		this.cardElement = card.element;

		const header = document.createElement('div');
		header.className = 'text-center mb-8';

		const title = document.createElement('h1');
		title.className = 'text-6xl font-black text-black mb-3 tracking-tight';
		title.textContent = 'HEXTRIS';
		header.appendChild(title);

		const subtitle = document.createElement('p');
		subtitle.className = 'text-gray-600 text-base font-medium';
		subtitle.textContent = 'Sign in to play';
		header.appendChild(subtitle);

		card.appendChild(header);

		const tabContainer = document.createElement('div');
		tabContainer.className = 'flex gap-2 mb-8';

		const loginTab = document.createElement('button');
		loginTab.textContent = 'Login';
		loginTab.className = 'flex-1 py-3 px-4 rounded-lg font-semibold transition-colors text-sm';
		loginTab.onclick = () => this.switchTab('login');

		const signupTab = document.createElement('button');
		signupTab.textContent = 'Sign Up';
		signupTab.className = 'flex-1 py-3 px-4 rounded-lg font-semibold transition-colors text-sm';
		signupTab.onclick = () => this.switchTab('signup');

		tabContainer.appendChild(loginTab);
		tabContainer.appendChild(signupTab);
		card.appendChild(tabContainer);

		(tabContainer as any)._loginTab = loginTab;
		(tabContainer as any)._signupTab = signupTab;
		this.updateTabStyles(tabContainer as any);

		this.formContainer = document.createElement('div');
		card.appendChild(this.formContainer);

		this.renderForm();

		const wrapper = document.createElement('div');
		wrapper.className = 'w-full max-w-md';
		wrapper.appendChild(card.element);

		this.element.appendChild(wrapper);
		this.mount();
	}

	private renderForm(): void {
		this.formContainer.innerHTML = '';

		if (this.currentTab === 'login') {
			this.renderLoginForm();
		} else {
			this.renderSignupForm();
		}
	}

	private renderLoginForm(): void {
		this.emailInput = new Input({
			label: 'Email',
			type: 'email',
			placeholder: 'your@email.com',
			required: true,
			onEnter: () => this.passwordInput.focus(),
		});
		this.formContainer.appendChild(this.emailInput.container);

		this.passwordInput = new Input({
			label: 'Password',
			type: 'password',
			placeholder: '••••••••',
			required: true,
			onEnter: () => this.handleSubmit(),
		});
		this.formContainer.appendChild(this.passwordInput.container);

		const forgotLink = document.createElement('div');
		forgotLink.className = 'text-right mb-4';
		const link = document.createElement('button');
		link.textContent = 'Forgot password?';
		link.className = 'text-sm text-gray-600 hover:text-black transition-colors';
		link.onclick = () => this.handleForgotPassword();
		forgotLink.appendChild(link);
		this.formContainer.appendChild(forgotLink);

		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'mt-6';

		this.submitButton = new Button('LOGIN', {
			variant: 'primary',
			size: 'large',
			fullWidth: true,
			onClick: () => this.handleSubmit(),
		});

		buttonContainer.appendChild(this.submitButton.element);
		this.formContainer.appendChild(buttonContainer);

		setTimeout(() => this.emailInput.focus(), 100);
	}

	private renderSignupForm(): void {
		this.nameInput = new Input({
			label: 'Name',
			placeholder: 'Your name',
			required: true,
			maxLength: 50,
			onEnter: () => this.emailInput.focus(),
		});
		this.formContainer.appendChild(this.nameInput.container);

		this.emailInput = new Input({
			label: 'Email',
			type: 'email',
			placeholder: 'your@email.com',
			required: true,
			onEnter: () => this.passwordInput.focus(),
		});
		this.formContainer.appendChild(this.emailInput.container);

		this.passwordInput = new Input({
			label: 'Password',
			type: 'password',
			placeholder: 'Min 8 characters',
			required: true,
			minLength: 8,
			onEnter: () => this.confirmPasswordInput.focus(),
		});
		this.formContainer.appendChild(this.passwordInput.container);

		this.confirmPasswordInput = new Input({
			label: 'Confirm Password',
			type: 'password',
			placeholder: 'Re-enter password',
			required: true,
			onEnter: () => this.handleSubmit(),
		});
		this.formContainer.appendChild(this.confirmPasswordInput.container);

		const buttonContainer = document.createElement('div');
		buttonContainer.className = 'mt-6';

		this.submitButton = new Button('SIGN UP', {
			variant: 'primary',
			size: 'large',
			fullWidth: true,
			onClick: () => this.handleSubmit(),
		});

		buttonContainer.appendChild(this.submitButton.element);
		this.formContainer.appendChild(buttonContainer);

		setTimeout(() => this.nameInput.focus(), 100);
	}

	private switchTab(tab: Tab): void {
		this.currentTab = tab;
		this.renderForm();
		this.updateTabStyles(this.cardElement.querySelector('.flex.gap-2') as any);
	}

	private updateTabStyles(tabContainer: any): void {
		if (!tabContainer || !tabContainer._loginTab || !tabContainer._signupTab) return;

		const activeClass = 'bg-black text-white';
		const inactiveClass = 'bg-gray-200 text-gray-700 hover:bg-gray-300';

		if (this.currentTab === 'login') {
			tabContainer._loginTab.className = `flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${activeClass}`;
			tabContainer._signupTab.className = `flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${inactiveClass}`;
		} else {
			tabContainer._loginTab.className = `flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${inactiveClass}`;
			tabContainer._signupTab.className = `flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${activeClass}`;
		}
	}

	private async handleSubmit(): Promise<void> {
		if (this.currentTab === 'login') {
			await this.handleLogin();
		} else {
			await this.handleSignup();
		}
	}

	private async handleLogin(): Promise<void> {
		if (!this.emailInput.validate() || !this.passwordInput.validate()) {
			return;
		}

		const email = this.emailInput.getValue();
		const password = this.passwordInput.getValue();

		this.submitButton.setLoading(true);
		this.emailInput.setDisabled(true);
		this.passwordInput.setDisabled(true);

		try {
			// Clear any existing session before creating a new one
			await authService.logout();

			const session = await authService.login({ email, password });

			let user = await appwriteClient.getUserById(session.userId);
			if (!user) {
				user = await appwriteClient.createUser(session.userId, session.name, session.email);
			}

			stateManager.updatePlayer({
				id: session.userId,
				name: user.name,
				highScore: user.singlePlayerHighScore,
				specialPoints: user.totalDiamonds,
				gamesPlayed: user.gamesPlayed,
				totalPlayTime: user.totalPlayTime,
				themesUnlocked: user.themesUnlocked as ThemeName[],
				selectedTheme: user.selectedTheme as ThemeName,
			});

			Router.getInstance().navigate(ROUTES.MENU);
		} catch (error: any) {
			this.showError(error.message || 'Login failed');
			this.submitButton.setLoading(false);
			this.emailInput.setDisabled(false);
			this.passwordInput.setDisabled(false);
		}
	}

	private async handleSignup(): Promise<void> {
		if (
			!this.nameInput.validate() ||
			!this.emailInput.validate() ||
			!this.passwordInput.validate() ||
			!this.confirmPasswordInput.validate()
		) {
			return;
		}

		const name = this.nameInput.getValue();
		const email = this.emailInput.getValue();
		const password = this.passwordInput.getValue();
		const confirmPassword = this.confirmPasswordInput.getValue();

		if (password !== confirmPassword) {
			this.showError('Passwords do not match');
			return;
		}

		this.submitButton.setLoading(true);
		this.nameInput.setDisabled(true);
		this.emailInput.setDisabled(true);
		this.passwordInput.setDisabled(true);
		this.confirmPasswordInput.setDisabled(true);

		try {
			const session = await authService.signUp({ email, password, name });
			const user = await appwriteClient.createUser(session.userId, name, email);

			stateManager.updatePlayer({
				id: session.userId,
				name: user.name,
				highScore: 0,
				specialPoints: user.totalDiamonds,
				gamesPlayed: 0,
				totalPlayTime: 0,
				themesUnlocked: [ThemeName.CLASSIC],
				selectedTheme: ThemeName.CLASSIC,
			});

			Router.getInstance().navigate(ROUTES.MENU);
		} catch (error: any) {
			this.showError(error.message || 'Sign up failed');
			this.submitButton.setLoading(false);
			this.nameInput.setDisabled(false);
			this.emailInput.setDisabled(false);
			this.passwordInput.setDisabled(false);
			this.confirmPasswordInput.setDisabled(false);
		}
	}

	private async handleForgotPassword(): Promise<void> {
		const email = prompt('Enter your email address:');
		if (!email) return;

		try {
			await authService.recoverPassword(email);
			alert('Password recovery email sent! Check your inbox.');
		} catch (error: any) {
			this.showError(error.message || 'Failed to send recovery email');
		}
	}

	private showError(message: string): void {
		const errorEl = document.createElement('div');
		errorEl.className = 'mt-4 p-3 bg-red-100 border-2 border-red-400 rounded-lg text-red-700 text-sm';
		errorEl.textContent = message;

		const existing = this.formContainer.querySelector('.bg-red-100');
		if (existing) existing.remove();

		this.formContainer.appendChild(errorEl);

		setTimeout(() => errorEl.remove(), 5000);
	}

	public onUnmount(): void {
		this.emailInput?.destroy();
		this.passwordInput?.destroy();
		this.nameInput?.destroy();
		this.confirmPasswordInput?.destroy();
		this.submitButton?.destroy();
	}
}
