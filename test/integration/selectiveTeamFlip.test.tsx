import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from '../../src/App'
import { localStorageMock } from '../setup'

// 統合テスト: 選択的チーム反転機能
describe('選択的チーム反転統合フロー', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('オフェンスプレーヤーのみの左右反転が正常に動作すること', async () => {
    const user = userEvent.setup()
    
    // 複数のプレーヤーを含むプレイを準備
    const testPlay = {
      id: 'flip-test-play',
      name: '反転テストプレイ',
      players: [
        { id: 'off-1', position: { x: 100, y: 200 }, team: 'offense', number: 1 },
        { id: 'off-2', position: { x: 150, y: 250 }, team: 'offense', number: 2 },
        { id: 'def-1', position: { x: 300, y: 400 }, team: 'defense', number: 11 },
        { id: 'def-2', position: { x: 350, y: 450 }, team: 'defense', number: 12 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([testPlay]))

    render(<App />)

    // 1. プレイを選択
    const playItem = screen.getByText('反転テストプレイ')
    await user.click(playItem)

    // 2. キャンバスにプレーヤーが表示されることを確認
    await waitFor(() => {
      const canvas = screen.getByRole('canvas')
      expect(canvas).toBeInTheDocument()
    })

    // 3. サイドバーの選択的反転コントロールを確認
    const offenseFlipButton = screen.getByRole('button', { name: /オフェンスのみ左右反転/ })
    expect(offenseFlipButton).toBeInTheDocument()

    // 4. オフェンスのみ左右反転を実行
    await user.click(offenseFlipButton)

    // 5. 反転後の座標を確認
    await waitFor(() => {
      const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const updatedPlay = updatedPlays[0]
      
      // オフェンス プレーヤーの座標が反転されている
      const offPlayer1 = updatedPlay.players.find((p: any) => p.id === 'off-1')
      const offPlayer2 = updatedPlay.players.find((p: any) => p.id === 'off-2')
      
      expect(offPlayer1.position.x).toBe(400 - 100) // フィールド幅400pxとして反転
      expect(offPlayer1.position.y).toBe(200) // Y座標は変わらず
      expect(offPlayer2.position.x).toBe(400 - 150)
      expect(offPlayer2.position.y).toBe(250) // Y座標は変わらず

      // ディフェンス プレーヤーの座標は変わらない
      const defPlayer1 = updatedPlay.players.find((p: any) => p.id === 'def-1')
      const defPlayer2 = updatedPlay.players.find((p: any) => p.id === 'def-2')
      
      expect(defPlayer1.position.x).toBe(300) // 元の座標のまま
      expect(defPlayer1.position.y).toBe(400)
      expect(defPlayer2.position.x).toBe(350) // 元の座標のまま
      expect(defPlayer2.position.y).toBe(450)
    })
  })

  it('ディフェンスプレーヤーのみの左右反転が正常に動作すること', async () => {
    const user = userEvent.setup()
    
    const testPlay = {
      id: 'flip-defense-test',
      name: 'ディフェンス反転テスト',
      players: [
        { id: 'off-1', position: { x: 100, y: 200 }, team: 'offense', number: 1 },
        { id: 'def-1', position: { x: 300, y: 400 }, team: 'defense', number: 11 },
        { id: 'def-2', position: { x: 350, y: 450 }, team: 'defense', number: 12 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([testPlay]))

    render(<App />)

    // 1. プレイを選択
    const playItem = screen.getByText('ディフェンス反転テスト')
    await user.click(playItem)

    // 2. ディフェンスのみ左右反転を実行
    const defenseFlipButton = screen.getByRole('button', { name: /ディフェンスのみ左右反転/ })
    await user.click(defenseFlipButton)

    // 3. 反転後の座標を確認
    await waitFor(() => {
      const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const updatedPlay = updatedPlays[0]
      
      // オフェンス プレーヤーの座標は変わらない
      const offPlayer = updatedPlay.players.find((p: any) => p.id === 'off-1')
      expect(offPlayer.position.x).toBe(100) // 元の座標のまま
      expect(offPlayer.position.y).toBe(200)

      // ディフェンス プレーヤーの座標が反転されている
      const defPlayer1 = updatedPlay.players.find((p: any) => p.id === 'def-1')
      const defPlayer2 = updatedPlay.players.find((p: any) => p.id === 'def-2')
      
      expect(defPlayer1.position.x).toBe(400 - 300) // 反転されている
      expect(defPlayer1.position.y).toBe(400) // Y座標は変わらず
      expect(defPlayer2.position.x).toBe(400 - 350) // 反転されている
      expect(defPlayer2.position.y).toBe(450) // Y座標は変わらず
    })
  })

  it('オフェンスプレーヤーのみの上下反転が正常に動作すること', async () => {
    const user = userEvent.setup()
    
    const testPlay = {
      id: 'flip-vertical-test',
      name: '上下反転テスト',
      players: [
        { id: 'off-1', position: { x: 100, y: 100 }, team: 'offense', number: 1 },
        { id: 'off-2', position: { x: 150, y: 150 }, team: 'offense', number: 2 },
        { id: 'def-1', position: { x: 300, y: 400 }, team: 'defense', number: 11 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([testPlay]))

    render(<App />)

    // 1. プレイを選択
    const playItem = screen.getByText('上下反転テスト')
    await user.click(playItem)

    // 2. オフェンスのみ上下反転を実行
    const offenseVerticalFlipButton = screen.getByRole('button', { name: /オフェンスのみ上下反転/ })
    await user.click(offenseVerticalFlipButton)

    // 3. 反転後の座標を確認
    await waitFor(() => {
      const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const updatedPlay = updatedPlays[0]
      
      // オフェンス プレーヤーのY座標が反転されている
      const offPlayer1 = updatedPlay.players.find((p: any) => p.id === 'off-1')
      const offPlayer2 = updatedPlay.players.find((p: any) => p.id === 'off-2')
      
      expect(offPlayer1.position.x).toBe(100) // X座標は変わらず
      expect(offPlayer1.position.y).toBe(600 - 100) // フィールド高600pxとして反転
      expect(offPlayer2.position.x).toBe(150) // X座標は変わらず
      expect(offPlayer2.position.y).toBe(600 - 150) // 反転されている

      // ディフェンス プレーヤーの座標は変わらない
      const defPlayer = updatedPlay.players.find((p: any) => p.id === 'def-1')
      expect(defPlayer.position.x).toBe(300) // 元の座標のまま
      expect(defPlayer.position.y).toBe(400) // 元の座標のまま
    })
  })

  it('複数の選択的反転操作を連続して実行できること', async () => {
    const user = userEvent.setup()
    
    const testPlay = {
      id: 'multi-flip-test',
      name: '複数反転テスト',
      players: [
        { id: 'off-1', position: { x: 100, y: 100 }, team: 'offense', number: 1 },
        { id: 'def-1', position: { x: 300, y: 400 }, team: 'defense', number: 11 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([testPlay]))

    render(<App />)

    // 1. プレイを選択
    const playItem = screen.getByText('複数反転テスト')
    await user.click(playItem)

    // 2. オフェンスのみ左右反転
    const offenseFlipButton = screen.getByRole('button', { name: /オフェンスのみ左右反転/ })
    await user.click(offenseFlipButton)

    // 3. ディフェンスのみ上下反転
    const defenseVerticalFlipButton = screen.getByRole('button', { name: /ディフェンスのみ上下反転/ })
    await user.click(defenseVerticalFlipButton)

    // 4. 両方の反転が適用されていることを確認
    await waitFor(() => {
      const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const updatedPlay = updatedPlays[0]
      
      // オフェンス プレーヤーは左右反転のみ
      const offPlayer = updatedPlay.players.find((p: any) => p.id === 'off-1')
      expect(offPlayer.position.x).toBe(400 - 100) // 左右反転
      expect(offPlayer.position.y).toBe(100) // 上下反転はされていない

      // ディフェンス プレーヤーは上下反転のみ
      const defPlayer = updatedPlay.players.find((p: any) => p.id === 'def-1')
      expect(defPlayer.position.x).toBe(300) // 左右反転はされていない
      expect(defPlayer.position.y).toBe(600 - 400) // 上下反転
    })
  })

  it('プレーヤーが1チームしかいない場合の選択的反転が正常に動作すること', async () => {
    const user = userEvent.setup()
    
    // オフェンスプレーヤーのみのプレイ
    const offenseOnlyPlay = {
      id: 'offense-only-test',
      name: 'オフェンスのみプレイ',
      players: [
        { id: 'off-1', position: { x: 100, y: 100 }, team: 'offense', number: 1 },
        { id: 'off-2', position: { x: 150, y: 150 }, team: 'offense', number: 2 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([offenseOnlyPlay]))

    render(<App />)

    // 1. プレイを選択
    const playItem = screen.getByText('オフェンスのみプレイ')
    await user.click(playItem)

    // 2. オフェンスのみ反転（該当プレーヤーあり）
    const offenseFlipButton = screen.getByRole('button', { name: /オフェンスのみ左右反転/ })
    await user.click(offenseFlipButton)

    // 3. ディフェンスのみ反転（該当プレーヤーなし）
    const defenseFlipButton = screen.getByRole('button', { name: /ディフェンスのみ左右反転/ })
    await user.click(defenseFlipButton)

    // 4. オフェンスプレーヤーのみ反転され、エラーが発生しないことを確認
    await waitFor(() => {
      const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const updatedPlay = updatedPlays[0]
      
      // オフェンス プレーヤーが反転されている
      const offPlayer1 = updatedPlay.players.find((p: any) => p.id === 'off-1')
      const offPlayer2 = updatedPlay.players.find((p: any) => p.id === 'off-2')
      
      expect(offPlayer1.position.x).toBe(400 - 100) // 反転されている
      expect(offPlayer2.position.x).toBe(400 - 150) // 反転されている

      // プレーヤー数は変わらない
      expect(updatedPlay.players).toHaveLength(2)

      // エラーメッセージが表示されないことを確認
      expect(screen.queryByText(/エラー/)).not.toBeInTheDocument()
    })
  })

  it('選択的反転操作がUndoシステムと連携すること', async () => {
    const user = userEvent.setup()
    
    const testPlay = {
      id: 'undo-flip-test',
      name: 'Undo反転テスト',
      players: [
        { id: 'off-1', position: { x: 100, y: 100 }, team: 'offense', number: 1 },
        { id: 'def-1', position: { x: 300, y: 400 }, team: 'defense', number: 11 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    localStorageMock.setItem('football-canvas-plays', JSON.stringify([testPlay]))

    render(<App />)

    // 1. プレイを選択
    const playItem = screen.getByText('Undo反転テスト')
    await user.click(playItem)

    // 2. オフェンスのみ左右反転
    const offenseFlipButton = screen.getByRole('button', { name: /オフェンスのみ左右反転/ })
    await user.click(offenseFlipButton)

    // 3. Undoボタンが有効になることを確認
    const undoButton = screen.getByRole('button', { name: /元に戻す/ })
    expect(undoButton).not.toBeDisabled()

    // 4. Undoを実行
    await user.click(undoButton)

    // 5. 元の座標に戻ることを確認
    await waitFor(() => {
      const updatedPlays = JSON.parse(localStorageMock.getItem('football-canvas-plays') || '[]')
      const updatedPlay = updatedPlays[0]
      
      // 元の座標に戻っている
      const offPlayer = updatedPlay.players.find((p: any) => p.id === 'off-1')
      const defPlayer = updatedPlay.players.find((p: any) => p.id === 'def-1')
      
      expect(offPlayer.position.x).toBe(100) // 元の座標
      expect(offPlayer.position.y).toBe(100)
      expect(defPlayer.position.x).toBe(300) // 元の座標
      expect(defPlayer.position.y).toBe(400)
    })
  })
})