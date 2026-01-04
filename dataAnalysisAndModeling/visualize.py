import numpy as np
import matplotlib
from pyquaternion import Quaternion
matplotlib.use('Qt5Agg')
import matplotlib.pyplot as plt


def init(show_drift = False):
    #plt.ion()
    # Create a 3D plot
    global fig
    global ax
    fig = plt.figure()
    if(show_drift):
        ax = fig.add_subplot(111)
        ax.set_title("Yaw Drift")
    else:
        ax = fig.add_subplot(111, projection='3d')
        ax.set_title('3D Body Posture Visualization')
    # Set title

def visualize_quat(neck_quat: Quaternion, lower_back_quat: Quaternion, upper_left_arm_quat,lower_left_arm_quat, upper_right_arm_quat, lower_right_arm_quat, show_complex = False):
    
    base_vector0 = np.array([1, 0, 0])
    lower_back_vector = lower_back_quat.rotate(base_vector0)
    lower_back_vector = Quaternion(axis=[0, 0, 1], angle=90*np.pi/180).rotate(lower_back_vector)
    base_vector0 = np.array([0,-1,0])
    neck_vector = neck_quat.rotate(base_vector0)
    
    base_vector = np.array([-1, 0, 0])
    upper_left_arm_vector = upper_left_arm_quat.rotate(base_vector)
    lower_left_arm_vector = lower_left_arm_quat.rotate(base_vector)
    base_vector = np.array([-1, 0, 0])
    upper_right_arm_vector = upper_right_arm_quat.rotate(base_vector)
    upper_right_arm_vector = Quaternion(axis=[0, 0, 1], angle=180*np.pi/180).rotate(upper_right_arm_vector)
    lower_right_arm_vector = lower_right_arm_quat.rotate(base_vector)
    lower_right_arm_vector = Quaternion(axis=[0, 0, 1], angle=180*np.pi/180).rotate(lower_right_arm_vector)
    if show_complex:
        square_vectors = np.array([[0.2,-0.2,1],[0.2,0.2,1],[-0.2,0.2,1],[-0.2,-0.2,1]])
        lower_back_vectors = np.zeros([4,3])
        for i in range(4):
            lower_back_vectors[i] = lower_back_quat.rotate(square_vectors[i])
        rectangle_vectors = np.array([[0.2,-0.4,1],[0.2,0.4,1],[-0.2,0.4,1],[-0.2,-0.4,1]])
        neck_vectors = np.zeros([4,3])
        for i in range(4):
            neck_vectors[i] = neck_quat.rotate(rectangle_vectors[i])

    # Clear the previous plot
    ax.clear()

    # Set static scale for the axes
    ax.set_xlim([-2, 2])
    ax.set_ylim([-2, 2])
    ax.set_zlim([-2, 2])

    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')

    """
    # Plot the body parts' orientation vectors
    ax.quiver(0, 0, 0, lower_back_x, lower_back_y, lower_back_z, length=1, normalize=True, color='r', label='Lower Back')
    ax.quiver(lower_back_x, lower_back_y, lower_back_z, neck_x+lower_back_x, neck_y+lower_back_y, neck_z+lower_back_z, length=1, normalize=True, color='g', label='Neck')
    ax.quiver(0, 0, 0, left_arm_x, left_arm_y, left_arm_z, length=1, normalize=True, color='b', label='Left Arm')
    ax.quiver(0, 0, 0, right_arm_x, right_arm_y, right_arm_z, length=1, normalize=True, color='y', label='Right Arm')
    """
    neck = lower_back_vector + neck_vector
    upper_left = neck + upper_left_arm_vector
    upper_right = neck + upper_right_arm_vector
    lower_left = upper_left + lower_left_arm_vector
    lower_right = upper_right + lower_right_arm_vector

    if show_complex:
        necks = lower_back_vectors+neck_vectors

    # Plot the body parts' orientation vectors
    ax.plot(np.array([0, lower_back_vector[0]]), np.array([0, lower_back_vector[1]]), np.array([0, lower_back_vector[2]]), color='r', label='Lower Back')
    ax.plot(np.array([lower_back_vector[0], neck[0]]), np.array([lower_back_vector[1], neck[1]]), np.array([lower_back_vector[2], neck[2]]), color='g', label='Neck')
    ax.plot(np.array([neck[0], upper_left[0]]), np.array([neck[1], upper_left[1]]), np.array([neck[2], upper_left[2]]), color='b', label='Upper Left Arm')
    ax.plot(np.array([neck[0], upper_right[0]]), np.array([neck[1], upper_right[1]]), np.array([neck[2], upper_right[2]]), color='y', label='Upper Right Arm')
    ax.plot(np.array([upper_left[0],lower_left[0]]), np.array([upper_left[1],lower_left[1]]), np.array([upper_left[2],lower_left[2]]), color='b', label='Lower Left Arm')
    ax.plot(np.array([upper_right[0],lower_right[0]]), np.array([upper_right[1],lower_right[1]]), np.array([upper_right[2],lower_right[2]]), color='y', label='Lower Right Arm')

    if show_complex:
        for i in range(4):
            ax.plot(np.array([square_vectors[i,0], lower_back_vectors[i,0]]), np.array([square_vectors[i,1], lower_back_vectors[i,1]]),np.array([0,lower_back_vectors[i,2]]), color='r',label=f'Lower Back {i}')
            ax.plot(np.array([lower_back_vectors[i,0], necks[i,0]]), np.array([lower_back_vectors[i,1], necks[i,1]]),np.array([lower_back_vectors[i,2], necks[i,2]]), color='g',label=f'Neck {i}')
            

    # Set legend
    #ax.legend(False)

    # Redraw the plot
    plt.draw()
    plt.pause(0.01)  # Pause for a short interval
    plt.show()
    # Optional: Adjust the update rate by changing the pause duration


print( np.array([-1, 0, 0]))
base_vector0 = np.array([-1, -1, -1])

q_default = Quaternion()
print(q_default)
q_default.rotate(base_vector0)
print(q_default)

q = Quaternion(w=0.7, x=0.4, y=0.7, z=0.2)

print(q)
a = q.rotate(base_vector0)
print(q)
print(a)


q = Quaternion(w=0.7, x=0.4, y=0.7, z=0.2)
base_vector0 = np.array([1, 0, 0])

rotated = q.rotate(base_vector0)

print("Orijinal vektör:", base_vector0)
print("Dönen vektör:", rotated)
"""
init()
visualize_quat(
    neck_quat=q_default,
    lower_back_quat=Quaternion(axis=[0, 0, 1], angle=np.pi/4),
    upper_left_arm_quat=Quaternion(axis=[0, 1, 0], angle=np.pi/6),
    lower_left_arm_quat=Quaternion(axis=[0, 1, 0], angle=-np.pi/6),
    upper_right_arm_quat=Quaternion(axis=[0, 1, 0], angle=-np.pi/6),
    lower_right_arm_quat=Quaternion(axis=[0, 1, 0], angle=np.pi/6),
)
"""

def visualize_10_sensor(lower_right_arm: Quaternion, upper_right_arm: Quaternion, right_shoulder: Quaternion, first_back: Quaternion, second_back: Quaternion, third_back: Quaternion, fourth_back: Quaternion, left_shoulder: Quaternion, upper_left_arm: Quaternion, lower_left_arm: Quaternion):
    base_vector0 = np.array([1, 0, 0])
    first_back_vector = first_back.rotate(base_vector0)
    first_back_vector = Quaternion(axis=[0, 0, 1], angle=90*np.pi/180).rotate(first_back_vector)
    
    second_back_vector = second_back.rotate(base_vector0)
    second_back_vector = Quaternion(axis=[0, 0, 1], angle=90*np.pi/180).rotate(second_back_vector)
    
    third_back_vector = third_back.rotate(base_vector0)
    third_back_vector = Quaternion(axis=[0, 0, 1], angle=90*np.pi/180).rotate(third_back_vector)
    
    fourt_back_vector = fourth_back.rotate(base_vector0)
    fourt_back_vector = Quaternion(axis=[0, 0, 1], angle=120*np.pi/180).rotate(fourt_back_vector)
    
    base_vector0 = np.array([-0.6, 0 , 0])
    left_shoulder_vector = left_shoulder.rotate(base_vector0)
    left_shoulder_vector = Quaternion(axis=[0, 1, 0], angle=60*np.pi/180).rotate(left_shoulder_vector)


    base_vector0 = np.array([-0.6, 0 ,0])
    right_shoulder_vector= right_shoulder.rotate(base_vector0)
    right_shoulder_vector = Quaternion(axis=[0, -1, 0], angle=60*np.pi/180).rotate(right_shoulder_vector)


    base_vector0 = np.array([0.8, 0, 0])

    lower_left_arm_vector = lower_left_arm.rotate(base_vector0)
    upper_left_arm_vector = upper_left_arm.rotate(base_vector0)
    #upper_left_arm_vector = Quaternion(axis=[0,0,1], angle=np.pi/90).rotate(upper_left_arm_vector)


    base_vector0 = np.array([-0.8, 0, 0])
    
    lower_right_arm_vector = lower_right_arm.rotate(base_vector0)
    lower_right_arm = Quaternion(axis=[1,0,0], angle=90*np.pi/180).rotate(lower_left_arm_vector)
    base_vector0 = np.array([-0.8, 0, 0])
    upper_right_arm_vector = upper_right_arm.rotate(base_vector0)
    upper_right_arm_vector = Quaternion(axis=[ 0,-1,0], angle=30*np.pi/180).rotate(upper_right_arm_vector)


    ax.clear()

    # Set static scale for the axes
    ax.set_xlim([-2, 2])
    ax.set_ylim([-2, 2])
    ax.set_zlim([-2, 2])

    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')


    back1 = first_back_vector + fourt_back_vector
    #back2= back1 + third_back_vector
    #back3 = back2 + fourt_back_vector
    rightback = back1 + right_shoulder_vector
    leftback = back1 + left_shoulder_vector

    upperleft= leftback + upper_left_arm_vector
    upperight= rightback + upper_right_arm_vector

    lowerleft = upperleft + lower_left_arm_vector
    lowerright = upperight +lower_right_arm_vector


    ax.plot(np.array([0, first_back_vector[0]]), np.array([0, first_back_vector[1]]), np.array([0, first_back_vector[2]]), color='r', label='Lower Back')
    ax.plot(np.array([first_back_vector[0], back1[0]]), np.array([first_back_vector[1], back1[1]]), np.array([first_back_vector[2], back1[2]]), color='g', label='Neck1')
    #ax.plot(np.array([back1[0], back2[0]]), np.array([back1[1], back2[1]]), np.array([back1[2], back2[2]]), color='r', label='Neck2')
    #ax.plot(np.array([back2[0], back3[0]]), np.array([back2[1], back3[1]]), np.array([back2[2], back3[2]]), color='g', label='Neck3')
    
    ax.plot(np.array([back1[0], rightback[0]]), np.array([back1[1], rightback[1]]), np.array([back1[2], rightback[2]]), color='b', label='Upper Right')
    ax.plot(np.array([back1[0], leftback[0]]), np.array([back1[1], leftback[1]]), np.array([back1[2], leftback[2]]), color='y', label='Upper Left')
    ax.plot(np.array([rightback[0],upperight[0]]), np.array([rightback[1],upperight[1]]), np.array([rightback[2],upperight[2]]), color='y', label='Lower Right Arm')
    ax.plot(np.array([leftback[0], upperleft[0]]), np.array([leftback[1],upperleft[1]]), np.array([leftback[2],upperleft[2]]), color='b', label='Lower Left Arm')
    ax.plot(np.array([upperight[0],lowerright[0]]), np.array([upperight[1],lowerright[1]]), np.array([upperight[2],lowerright[2]]), color='b', label='Lower Right Arm')
    #ax.plot(np.array([upperleft[0],lowerleft[0]]), np.array([upperleft[1],lowerleft[1]]), np.array([upperleft[2],lowerleft[2]]), color='y', label='Lower Right Arm')

    plt.draw()
    plt.pause(0.01) 


def visualize_10_sensors(
    lower_right_arm: Quaternion,
    upper_right_arm: Quaternion,
    right_shoulder: Quaternion,
    first_back: Quaternion,
    second_back: Quaternion,
    third_back: Quaternion,
    fourth_back: Quaternion,
    left_shoulder: Quaternion,
    upper_left_arm: Quaternion,
    lower_left_arm: Quaternion
):
    """
    Plot a kinematic chain of 10 sensors in an upright (standing) orientation:
      back1 -> back2 -> back3 -> back4 -> shoulder R/L -> upper arm R/L -> lower arm R/L

    Each sensor’s reading is first adjusted by a mounting offset, then rotated into world space.
    Finally, a global rotation aligns the spine with the vertical (Z) axis.
    """
    #-----------------------------------------------------------------------------#
    # 1) Define per-sensor mounting offsets: adjust these to match your sensor mounts
    #-----------------------------------------------------------------------------#
    mounting_offsets = {
        'first_back':       Quaternion(axis=[0, 0, 1], angle=np.deg2rad( 90)),
        'second_back':      Quaternion(axis=[0, 0, 1], angle=np.deg2rad( 90)),
        'third_back':       Quaternion(axis=[0, 0, 1], angle=np.deg2rad( 90)),
        'fourth_back':      Quaternion(axis=[0, 0, 1], angle=np.deg2rad( 90)),
        'right_shoulder':   Quaternion(axis=[0, 1, 0], angle=np.deg2rad(-90)),
        'upper_right_arm':  Quaternion(axis=[0, 1, 0], angle=np.deg2rad( 0)),
        'lower_right_arm':  Quaternion(axis=[0, 1, 0], angle=np.deg2rad( 0)),
        'left_shoulder':    Quaternion(axis=[0, 1, 0], angle=np.deg2rad( 90)),
        'upper_left_arm':   Quaternion(axis=[0, 1, 0], angle=np.deg2rad( 0)),
        'lower_left_arm':   Quaternion(axis=[0, 1, 0], angle=np.deg2rad( 0)),
    }

    #-----------------------------------------------------------------------------#
    # 2) Choose one canonical bone axis in each sensor's local frame
    #    (here +X direction points along the bone in sensor frame)
    #-----------------------------------------------------------------------------#
    canonical_axis = np.array([1.0, 0.0, 0.0])

    #-----------------------------------------------------------------------------#
    # 3) Helper: apply mounting offset then sensor rotation
    #-----------------------------------------------------------------------------#
    def get_segment_vector(sensor_quat: Quaternion, name: str) -> np.ndarray:
        adjusted = sensor_quat * mounting_offsets[name]
        return adjusted.rotate(canonical_axis)

    #-----------------------------------------------------------------------------#
    # 4) Get all segment vectors
    #-----------------------------------------------------------------------------#
    v1 = get_segment_vector(first_back,      'first_back')
    v2 = get_segment_vector(second_back,     'second_back')
    v3 = get_segment_vector(third_back,      'third_back')
    v4 = get_segment_vector(fourth_back,     'fourth_back')

    vs_r = get_segment_vector(right_shoulder, 'right_shoulder')
    vu_r = get_segment_vector(upper_right_arm, 'upper_right_arm')
    vl_r = get_segment_vector(lower_right_arm, 'lower_right_arm')

    vs_l = get_segment_vector(left_shoulder,  'left_shoulder')
    vu_l = get_segment_vector(upper_left_arm,  'upper_left_arm')
    vl_l = get_segment_vector(lower_left_arm,  'lower_left_arm')

    #-----------------------------------------------------------------------------#
    # 5) Chain positions in sensor/world frame (initially along X axis)
    #-----------------------------------------------------------------------------#
    p0 = np.zeros(3)
    p1 = p0 + v1
    p2 = p1 + v2
    p3 = p2 + v3
    p4 = p3 + v4

    p5_r = p4 + vs_r
    p6_r = p5_r + vu_r
    p7_r = p6_r + vl_r

    p5_l = p4 + vs_l
    p6_l = p5_l + vu_l
    p7_l = p6_l + vl_l

    #-----------------------------------------------------------------------------#
    # 6) Apply global rotation to stand upright: rotate +X to +Z
    #-----------------------------------------------------------------------------#
    global_rot = Quaternion(axis=[0, 1, 0], angle=np.deg2rad(90))
    points = [p0, p1, p2, p3, p4, p5_r, p6_r, p7_r, p5_l, p6_l, p7_l]
    p0, p1, p2, p3, p4, p5_r, p6_r, p7_r, p5_l, p6_l, p7_l = [global_rot.rotate(p) for p in points]

    #-----------------------------------------------------------------------------#
    # 7) Plot
    #-----------------------------------------------------------------------------#
    fig = plt.figure()
    ax  = fig.add_subplot(111, projection='3d')

    # Static axes scale
    for axis in (ax.set_xlim, ax.set_ylim, ax.set_zlim):
        axis((-4, 4))
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')

    # Draw the spine
    xs, ys, zs = zip(p0, p1, p2, p3, p4)
    ax.plot(xs, ys, zs, '-o', label='Spine')

    # Right arm
    xs_r, ys_r, zs_r = zip(p4, p5_r, p6_r, p7_r)
    ax.plot(xs_r, ys_r, zs_r, '-o', label='Right Arm')

    # Left arm
    xs_l, ys_l, zs_l = zip(p4, p5_l, p6_l, p7_l)
    ax.plot(xs_l, ys_l, zs_l, '-o', label='Left Arm')

    ax.legend()
    plt.draw()
    plt.pause(0.1)

def visualize_10_sensorforread(lower_right_arm: Quaternion, upper_right_arm: Quaternion, right_shoulder: Quaternion, first_back: Quaternion, second_back: Quaternion, third_back: Quaternion, fourth_back: Quaternion, left_shoulder: Quaternion, upper_left_arm: Quaternion, lower_left_arm: Quaternion):
    base_vector0 = np.array([1, 0, 0])
    first_back_vector = first_back.rotate(base_vector0)
    first_back_vector = Quaternion(axis=[0, 1, 0], angle=150*np.pi/180).rotate(first_back_vector)
    
    second_back_vector = second_back.rotate(base_vector0)
    second_back_vector = Quaternion(axis=[0, 0, 1], angle=90*np.pi/180).rotate(second_back_vector)
    
    third_back_vector = third_back.rotate(base_vector0)
    third_back_vector = Quaternion(axis=[0, 0, 1], angle=90*np.pi/180).rotate(third_back_vector)
    
    fourt_back_vector = fourth_back.rotate(base_vector0)
    fourt_back_vector = Quaternion(axis=[0, 1, 0], angle=120*np.pi/180).rotate(fourt_back_vector)
    
    base_vector0 = np.array([0.6, 0 , 0])
    left_shoulder_vector = left_shoulder.rotate(base_vector0)
    left_shoulder_vector = Quaternion(axis=[0, 1, 0], angle=60*np.pi/180).rotate(left_shoulder_vector)


    base_vector0 = np.array([0.6, 0 ,0])
    right_shoulder_vector= right_shoulder.rotate(base_vector0)
    right_shoulder_vector = Quaternion(axis=[0, -1, 0], angle=60*np.pi/180).rotate(right_shoulder_vector)


    base_vector0 = np.array([0.8, 0, 0])

    lower_left_arm_vector = lower_left_arm.rotate(base_vector0)
    lower_left_arm_vector = Quaternion(axis= [0,1,0], angle= 130*np.pi/180).rotate(lower_left_arm_vector)
    upper_left_arm_vector = upper_left_arm.rotate(base_vector0)
    upper_left_arm_vector = Quaternion(axis=[ 0,1,0], angle=150*np.pi/180).rotate(upper_left_arm_vector)

    #upper_left_arm_vector = Quaternion(axis=[0,0,1], angle=np.pi/90).rotate(upper_left_arm_vector)


    base_vector0 = np.array([-0.8, 0, 0])
    
    lower_right_arm_vector = lower_right_arm.rotate(base_vector0)
    #lower_right_arm_vector = Quaternion(axis=[1,0,0], angle=90*np.pi/180).rotate(lower_left_arm_vector)
    base_vector0 = np.array([0.8, 0, 0])
    upper_right_arm_vector = upper_right_arm.rotate(base_vector0)
    upper_right_arm_vector = Quaternion(axis=[0,-1,0], angle=30*np.pi/180).rotate(upper_right_arm_vector)


    ax.clear()

    # Set static scale for the axes
    ax.set_xlim([-2, 2])
    ax.set_ylim([-2, 2])
    ax.set_zlim([-2, 2])

    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')


    back1 = first_back_vector + fourt_back_vector
    #back2= back1 + third_back_vector
    #back3 = back2 + fourt_back_vector
    rightback = back1 + right_shoulder_vector
    leftback = back1 + left_shoulder_vector

    upperleft= leftback + upper_left_arm_vector
    upperight= rightback + upper_right_arm_vector

    lowerleft = upperleft + lower_left_arm_vector
    lowerright = upperight +lower_right_arm_vector


    ax.plot(np.array([0, first_back_vector[0]]), np.array([0, first_back_vector[1]]), np.array([0, first_back_vector[2]]), color='r', label='Lower Back')
    ax.plot(np.array([first_back_vector[0], back1[0]]), np.array([first_back_vector[1], back1[1]]), np.array([first_back_vector[2], back1[2]]), color='g', label='Neck1')
    #ax.plot(np.array([back1[0], back2[0]]), np.array([back1[1], back2[1]]), np.array([back1[2], back2[2]]), color='r', label='Neck2')
    #ax.plot(np.array([back2[0], back3[0]]), np.array([back2[1], back3[1]]), np.array([back2[2], back3[2]]), color='g', label='Neck3')
    
    ax.plot(np.array([back1[0], rightback[0]]), np.array([back1[1], rightback[1]]), np.array([back1[2], rightback[2]]), color='b', label='Upper Right')
    ax.plot(np.array([back1[0], leftback[0]]), np.array([back1[1], leftback[1]]), np.array([back1[2], leftback[2]]), color='y', label='Upper Left')
    ax.plot(np.array([rightback[0],upperight[0]]), np.array([rightback[1],upperight[1]]), np.array([rightback[2],upperight[2]]), color='y', label='Lower Right Arm')
    ax.plot(np.array([leftback[0], upperleft[0]]), np.array([leftback[1],upperleft[1]]), np.array([leftback[2],upperleft[2]]), color='b', label='Lower Left Arm')
    ax.plot(np.array([upperight[0],lowerright[0]]), np.array([upperight[1],lowerright[1]]), np.array([upperight[2],lowerright[2]]), color='b', label='Lower Right Arm')
    ax.plot(np.array([upperleft[0],lowerleft[0]]), np.array([upperleft[1],lowerleft[1]]), np.array([upperleft[2],lowerleft[2]]), color='y', label='Lower Right Arm')

    plt.draw()
    plt.pause(0.01) 