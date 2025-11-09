import * as THREE from 'three';

/**
 * Graphics3D - 3D rendering engine using Three.js
 * Handles scene setup, camera, lighting, and 3D object rendering
 */
class Graphics3D {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Camera setup - Third person view
        this.camera = new THREE.PerspectiveCamera(
            60, // FOV
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near plane
            1000 // Far plane
        );

        // Camera will follow player from behind and above
        this.cameraOffset = new THREE.Vector3(0, 8, -12);
        this.cameraLookAtOffset = new THREE.Vector3(0, 2, 10);
        this.cameraSmoothing = 0.1;

        // Lighting setup
        this.setupLighting();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Store 3D objects
        this.objects = new Map();

        console.log('Graphics3D initialized');
    }

    setupLighting() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun) with shadows
        this.sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.sunLight.position.set(10, 20, 10);
        this.sunLight.castShadow = true;

        // Shadow settings
        this.sunLight.shadow.camera.left = -50;
        this.sunLight.shadow.camera.right = 50;
        this.sunLight.shadow.camera.top = 50;
        this.sunLight.shadow.camera.bottom = -50;
        this.sunLight.shadow.camera.near = 0.1;
        this.sunLight.shadow.camera.far = 100;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;

        this.scene.add(this.sunLight);

        // Hemisphere light for sky/ground ambient
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x6B8E23, 0.4);
        this.scene.add(hemiLight);
    }

    /**
     * Create a 3D chicken model with smooth geometry
     */
    createChicken(colors) {
        const chicken = new THREE.Group();

        // Body - smooth sphere
        const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        bodyGeometry.scale(1, 0.8, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: colors.body,
            roughness: 0.6,
            metalness: 0.1
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.5;
        body.castShadow = true;
        body.receiveShadow = true;
        chicken.add(body);

        // Head - smooth sphere
        const headGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: colors.head,
            roughness: 0.6,
            metalness: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0.6, 1.2, 0);
        head.castShadow = true;
        chicken.add(head);

        // Beak - cone
        const beakGeometry = new THREE.ConeGeometry(0.15, 0.4, 16);
        beakGeometry.rotateZ(-Math.PI / 2);
        const beakMaterial = new THREE.MeshStandardMaterial({
            color: colors.beak,
            roughness: 0.5
        });
        const beak = new THREE.Mesh(beakGeometry, beakMaterial);
        beak.position.set(1.0, 1.2, 0);
        beak.castShadow = true;
        chicken.add(beak);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: colors.eye,
            roughness: 0.2,
            metalness: 0.8
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.8, 1.3, 0.2);
        chicken.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.8, 1.3, -0.2);
        chicken.add(rightEye);

        // Comb - series of small spheres
        const combGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const combMaterial = new THREE.MeshStandardMaterial({
            color: colors.comb,
            roughness: 0.7
        });

        for (let i = 0; i < 3; i++) {
            const combPiece = new THREE.Mesh(combGeometry, combMaterial);
            combPiece.position.set(0.4 + i * 0.2, 1.6, 0);
            combPiece.scale.set(1, 1.2, 0.8);
            combPiece.castShadow = true;
            chicken.add(combPiece);
        }

        // Feet
        const footGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
        const footMaterial = new THREE.MeshStandardMaterial({
            color: colors.feet,
            roughness: 0.8
        });

        const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
        leftFoot.position.set(0.2, 0, 0.3);
        leftFoot.castShadow = true;
        chicken.add(leftFoot);

        const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
        rightFoot.position.set(0.2, 0, -0.3);
        rightFoot.castShadow = true;
        chicken.add(rightFoot);

        // Wings (simple ellipsoids)
        const wingGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        wingGeometry.scale(0.5, 0.8, 1.2);
        const wingMaterial = new THREE.MeshStandardMaterial({
            color: colors.body,
            roughness: 0.7
        });

        const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
        leftWing.position.set(0, 0.7, 0.9);
        leftWing.castShadow = true;
        chicken.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
        rightWing.position.set(0, 0.7, -0.9);
        rightWing.castShadow = true;
        chicken.add(rightWing);

        // Store references for animation
        chicken.userData.body = body;
        chicken.userData.head = head;
        chicken.userData.leftWing = leftWing;
        chicken.userData.rightWing = rightWing;
        chicken.userData.leftFoot = leftFoot;
        chicken.userData.rightFoot = rightFoot;

        return chicken;
    }

    /**
     * Create a 3D car obstacle
     */
    createCar(color) {
        const car = new THREE.Group();

        // Car body
        const bodyGeometry = new THREE.BoxGeometry(4, 1.2, 2);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.6;
        body.castShadow = true;
        body.receiveShadow = true;
        car.add(body);

        // Car roof
        const roofGeometry = new THREE.BoxGeometry(2, 0.8, 1.8);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.6
        });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(-0.2, 1.6, 0);
        roof.castShadow = true;
        car.add(roof);

        // Windows
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x444444,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.5
        });

        const windowGeometry = new THREE.BoxGeometry(1.9, 0.7, 1.7);
        const windows = new THREE.Mesh(windowGeometry, windowMaterial);
        windows.position.set(-0.2, 1.6, 0);
        car.add(windows);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        wheelGeometry.rotateZ(Math.PI / 2);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });

        const wheelPositions = [
            [1.3, 0.4, 1.1],
            [1.3, 0.4, -1.1],
            [-1.3, 0.4, 1.1],
            [-1.3, 0.4, -1.1]
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(...pos);
            wheel.castShadow = true;
            car.add(wheel);
        });

        return car;
    }

    /**
     * Create a log obstacle
     */
    createLog(length = 4) {
        const log = new THREE.Group();

        const logGeometry = new THREE.CylinderGeometry(0.5, 0.5, length, 16);
        logGeometry.rotateZ(Math.PI / 2);
        const logMaterial = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });
        const logMesh = new THREE.Mesh(logGeometry, logMaterial);
        logMesh.castShadow = true;
        logMesh.receiveShadow = true;
        log.add(logMesh);

        // End caps
        const capMaterial = new THREE.MeshStandardMaterial({
            color: 0xDEB887,
            roughness: 0.8
        });

        const capGeometry = new THREE.CircleGeometry(0.5, 16);

        const leftCap = new THREE.Mesh(capGeometry, capMaterial);
        leftCap.position.x = -length / 2;
        leftCap.rotation.y = -Math.PI / 2;
        log.add(leftCap);

        const rightCap = new THREE.Mesh(capGeometry, capMaterial);
        rightCap.position.x = length / 2;
        rightCap.rotation.y = Math.PI / 2;
        log.add(rightCap);

        return log;
    }

    /**
     * Create ground plane for a lane
     */
    createLane(type, width = 100, depth = 4) {
        const geometry = new THREE.PlaneGeometry(width, depth);
        geometry.rotateX(-Math.PI / 2);

        let color, texture;
        switch(type) {
            case 'grass':
                color = 0x6B8E23;
                break;
            case 'road':
                color = 0x404040;
                break;
            case 'water':
                color = 0x4169E1;
                break;
            default:
                color = 0x808080;
        }

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: type === 'water' ? 0.2 : 0.9,
            metalness: type === 'water' ? 0.3 : 0.0
        });

        const lane = new THREE.Mesh(geometry, material);
        lane.receiveShadow = true;

        return lane;
    }

    /**
     * Update camera to follow player (third-person)
     */
    updateCamera(playerPosition) {
        if (!playerPosition) return;

        // Target camera position (behind and above player)
        const targetPosition = new THREE.Vector3(
            playerPosition.x + this.cameraOffset.x,
            playerPosition.y + this.cameraOffset.y,
            playerPosition.z + this.cameraOffset.z
        );

        // Smooth camera movement
        this.camera.position.lerp(targetPosition, this.cameraSmoothing);

        // Look at point ahead of player
        const lookAtPoint = new THREE.Vector3(
            playerPosition.x + this.cameraLookAtOffset.x,
            playerPosition.y + this.cameraLookAtOffset.y,
            playerPosition.z + this.cameraLookAtOffset.z
        );

        this.camera.lookAt(lookAtPoint);

        // Update sun to follow player
        this.sunLight.position.set(
            playerPosition.x + 10,
            20,
            playerPosition.z + 10
        );
    }

    /**
     * Add object to scene
     */
    addObject(name, object) {
        this.scene.add(object);
        this.objects.set(name, object);
        return object;
    }

    /**
     * Remove object from scene
     */
    removeObject(name) {
        const object = this.objects.get(name);
        if (object) {
            this.scene.remove(object);
            this.objects.delete(name);
        }
    }

    /**
     * Get object by name
     */
    getObject(name) {
        return this.objects.get(name);
    }

    /**
     * Clear all objects from scene
     */
    clearObjects() {
        this.objects.forEach((object, name) => {
            this.scene.remove(object);
        });
        this.objects.clear();
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Render the scene
     */
    render() {
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Get renderer for external use
     */
    getRenderer() {
        return this.renderer;
    }

    /**
     * Get scene for external use
     */
    getScene() {
        return this.scene;
    }

    /**
     * Get camera for external use
     */
    getCamera() {
        return this.camera;
    }
}

export default Graphics3D;
